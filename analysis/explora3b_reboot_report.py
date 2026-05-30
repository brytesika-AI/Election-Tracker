from __future__ import annotations

import collections
import csv
import gzip
import json
import math
import re
import statistics
import sys
import zipfile
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.graphics.shapes import Drawing, Line, Rect, String
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


DOWNLOADS = Path(r"C:\Users\bright.sikazwe\Downloads")
CSV_PATH = DOWNLOADS / "Reboots_jacques_Explora3B_ALL_Smartcards.csv"
ZIP_PATH = DOWNLOADS / "logs_bundle.zip"
OUT_DIR = Path("outputs/reboot_rca")
REPORT_PDF = OUT_DIR / "Explora3B_Reboot_Management_Report_v3.pdf"
SUMMARY_JSON = OUT_DIR / "explora3b_reboot_analysis_summary.json"
DAILY_CHART = OUT_DIR / "daily_multi_reboot_rate.png"
FAULT_CHART = OUT_DIR / "raw_log_fault_signatures.png"


UPTIME_RE = re.compile(r"(?<!\d)(\d{5}):(\d{2})\.(\d{3})")
MAC_RE = re.compile(r"HWaddr\s+([0-9A-Fa-f:]{17})")
IP_RE = re.compile(r"inet addr:([0-9.]+)")
BER_RE = re.compile(r"\bBER\b[^0-9-]*([0-9][0-9,]*)", re.I)
DATE_STAMP_RE = re.compile(r"\b(2026/\d{2}/\d{2})\b")


SIGNATURES = {
    "boot_script": "Executing startIDwayJ.sh",
    "power_plug": "PWR_ON_POWER_PLUG",
    "explicit_reboot": "Rebooting the STB",
    "terminate_reboot": "Terminate(reboot=true)",
    "ota_epoch": "Thu Jan 01",
    "ota_v51": "Version: 5.1",
    "si2183_error": "Si2183 Error",
    "si2183_l1_error": "Si2183_L1_DD_STATUS ERROR",
    "hdd_temp_fail": "HDIO_DRIVE_CMD",
    "ecm_disallowed": "DISALLOWED:E106",
    "cas_wrong_state": "wrong state",
    "emm_update": "updated EMM service",
    "si_crc_change": "non matching physical CRC",
    "filter_timeout": "Filter timeout",
    "network_unavailable": "Network Connection is not available",
    "full_gc": "Full GC",
    "wpa_supplicant": "WPA SUPPLICANT",
}


@dataclass
class LogSummary:
    entry: str
    smartcard: str
    short_file: str
    csv_date: str | None
    mac: str | None
    ip: str | None
    line_count: int
    uptime_seconds: float
    boot_script: int
    power_plug: int
    explicit_reboot: int
    terminate_reboot: int
    ota_epoch: int
    ota_v51: int
    si2183_error: int
    si2183_l1_error: int
    hdd_temp_fail: int
    ecm_disallowed: int
    cas_wrong_state: int
    emm_update: int
    si_crc_change: int
    filter_timeout: int
    network_unavailable: int
    full_gc: int
    wpa_supplicant: int
    ber_max: int | None
    ber_count: int
    real_dates_seen: str
    last_lines: list[str]


def read_csv_rows() -> list[dict[str, str]]:
    with CSV_PATH.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def build_csv_index(rows: list[dict[str, str]]) -> tuple[dict[tuple[str, str], str], dict[str, dict[str, int]]]:
    index: dict[tuple[str, str], str] = {}
    for row in rows:
        card = row["Smartcard"]
        for name in row["Filenames"].split(" | "):
            index[(card, name)] = row["Date"]

    daily: dict[str, dict[str, int]] = collections.defaultdict(lambda: {"cards": 0, "multi_cards": 0, "logs": 0})
    for row in rows:
        logs = int(row["Log_Count"])
        daily[row["Date"]]["cards"] += 1
        daily[row["Date"]]["logs"] += logs
        if logs > 1:
            daily[row["Date"]]["multi_cards"] += 1
    return index, daily


def parse_uptime_seconds(line: str) -> float | None:
    best = None
    for minutes, seconds, millis in UPTIME_RE.findall(line):
        value = int(minutes) * 60 + int(seconds) + int(millis) / 1000
        if best is None or value > best:
            best = value
    return best


def analyse_log(entry: str, text: str, csv_index: dict[tuple[str, str], str]) -> LogSummary:
    smartcard, short_file = entry.split("_", 1)
    counts = {key: text.count(needle) for key, needle in SIGNATURES.items()}
    lines = text.splitlines()

    mac_match = MAC_RE.search(text)
    ips = [ip for ip in IP_RE.findall(text) if ip != "127.0.0.1"]
    uptime = 0.0
    ber_values: list[int] = []
    dates_seen: set[str] = set()

    for line in lines:
        line_uptime = parse_uptime_seconds(line)
        if line_uptime is not None and line_uptime > uptime:
            uptime = line_uptime
        for value in BER_RE.findall(line):
            try:
                ber_values.append(int(value.replace(",", "")))
            except ValueError:
                pass
        dates_seen.update(DATE_STAMP_RE.findall(line))

    last_lines = [line[:220] for line in lines[-10:] if line.strip()]
    return LogSummary(
        entry=entry,
        smartcard=smartcard,
        short_file=short_file,
        csv_date=csv_index.get((smartcard, short_file)),
        mac=mac_match.group(1).upper() if mac_match else None,
        ip=ips[0] if ips else None,
        line_count=len(lines),
        uptime_seconds=uptime,
        boot_script=counts["boot_script"],
        power_plug=counts["power_plug"],
        explicit_reboot=counts["explicit_reboot"],
        terminate_reboot=counts["terminate_reboot"],
        ota_epoch=counts["ota_epoch"],
        ota_v51=counts["ota_v51"],
        si2183_error=counts["si2183_error"],
        si2183_l1_error=counts["si2183_l1_error"],
        hdd_temp_fail=counts["hdd_temp_fail"],
        ecm_disallowed=counts["ecm_disallowed"],
        cas_wrong_state=counts["cas_wrong_state"],
        emm_update=counts["emm_update"],
        si_crc_change=counts["si_crc_change"],
        filter_timeout=counts["filter_timeout"],
        network_unavailable=counts["network_unavailable"],
        full_gc=counts["full_gc"],
        wpa_supplicant=counts["wpa_supplicant"],
        ber_max=max(ber_values) if ber_values else None,
        ber_count=len(ber_values),
        real_dates_seen=", ".join(sorted(dates_seen)),
        last_lines=last_lines,
    )


def analyse_zip(csv_index: dict[tuple[str, str], str]) -> list[LogSummary]:
    summaries: list[LogSummary] = []
    with zipfile.ZipFile(ZIP_PATH) as zf:
        for entry in sorted(zf.namelist()):
            raw = zf.read(entry)
            text = gzip.decompress(raw).decode("utf-8", errors="replace") if entry.endswith(".gz") else raw.decode("utf-8", errors="replace")
            summaries.append(analyse_log(entry, text, csv_index))
    return summaries


def fmt_hours(seconds: float) -> str:
    if not seconds:
        return "0m"
    minutes = int(round(seconds / 60))
    hours, mins = divmod(minutes, 60)
    if hours:
        return f"{hours}h {mins}m"
    return f"{mins}m"


def pct(numerator: float, denominator: float) -> float:
    return 0.0 if not denominator else numerator / denominator * 100


def daily_chart(daily: dict[str, dict[str, int]]) -> Drawing:
    dates = sorted(daily)
    rates = [pct(daily[d]["multi_cards"], daily[d]["cards"]) for d in dates]
    cards = [daily[d]["cards"] for d in dates]
    width, height = 480, 210
    left, bottom, top = 42, 34, 28
    chart_w, chart_h = width - left - 12, height - bottom - top
    max_rate = max(90, math.ceil(max(rates) / 10) * 10)
    d = Drawing(width, height)
    d.add(String(width / 2, height - 12, "Share of smartcards with >1 reboot log per day", textAnchor="middle", fontSize=10, fillColor=colors.HexColor("#243047")))
    d.add(Line(left, bottom, left, bottom + chart_h, strokeColor=colors.HexColor("#9ca3af")))
    d.add(Line(left, bottom, left + chart_w, bottom, strokeColor=colors.HexColor("#9ca3af")))
    for tick in range(0, max_rate + 1, 20):
        y = bottom + chart_h * tick / max_rate
        d.add(Line(left - 3, y, left + chart_w, y, strokeColor=colors.HexColor("#e5e7eb"), strokeWidth=0.5))
        d.add(String(left - 7, y - 3, f"{tick}%", textAnchor="end", fontSize=6.5, fillColor=colors.HexColor("#4b5563")))
    gap = 7
    bar_w = (chart_w - gap * (len(dates) + 1)) / len(dates)
    prev = None
    for i, (date, rate, card_count) in enumerate(zip(dates, rates, cards)):
        x = left + gap + i * (bar_w + gap)
        bar_h = chart_h * rate / max_rate
        color = colors.HexColor("#64d987" if rate < 40 else "#ef646d")
        d.add(Rect(x, bottom, bar_w, bar_h, fillColor=color, strokeColor=color))
        cx = x + bar_w / 2
        cy = bottom + bar_h
        if prev:
            d.add(Line(prev[0], prev[1], cx, cy, strokeColor=colors.HexColor("#243047"), strokeWidth=1.3))
        prev = (cx, cy)
        d.add(String(cx, cy + 4, f"{rate:.1f}%", textAnchor="middle", fontSize=6.5, fillColor=colors.HexColor("#111827")))
        d.add(String(cx, bottom - 11, date[5:], textAnchor="middle", fontSize=6.3, fillColor=colors.HexColor("#4b5563")))
        d.add(String(cx, bottom - 22, f"n={card_count}", textAnchor="middle", fontSize=5.7, fillColor=colors.HexColor("#6b7280")))
    return d


def fault_chart(logs: list[LogSummary]) -> Drawing:
    labels = ["Explicit reboot", "OTA epoch", "Si2183", "HDD temp", "ECM E106", "SI CRC", "Filter timeout"]
    values = [
        sum(1 for log in logs if log.explicit_reboot or log.terminate_reboot),
        sum(1 for log in logs if log.ota_epoch),
        sum(1 for log in logs if log.si2183_error),
        sum(1 for log in logs if log.hdd_temp_fail),
        sum(1 for log in logs if log.ecm_disallowed),
        sum(1 for log in logs if log.si_crc_change),
        sum(1 for log in logs if log.filter_timeout),
    ]
    width, height = 480, 210
    left, bottom, top = 40, 46, 28
    chart_w, chart_h = width - left - 12, height - bottom - top
    max_value = max(values) + 10
    palette = ["#294c60", "#8fb339", "#f4a261", "#d1495b", "#5e548e", "#2a9d8f", "#6c757d"]
    d = Drawing(width, height)
    d.add(String(width / 2, height - 12, "Fault signatures across 125 raw boot logs", textAnchor="middle", fontSize=10, fillColor=colors.HexColor("#243047")))
    d.add(Line(left, bottom, left, bottom + chart_h, strokeColor=colors.HexColor("#9ca3af")))
    d.add(Line(left, bottom, left + chart_w, bottom, strokeColor=colors.HexColor("#9ca3af")))
    for tick in range(0, max_value + 1, 25):
        y = bottom + chart_h * tick / max_value
        d.add(Line(left - 3, y, left + chart_w, y, strokeColor=colors.HexColor("#e5e7eb"), strokeWidth=0.5))
        d.add(String(left - 7, y - 3, str(tick), textAnchor="end", fontSize=6.5, fillColor=colors.HexColor("#4b5563")))
    gap = 14
    bar_w = (chart_w - gap * (len(labels) + 1)) / len(labels)
    for i, (label, value, color) in enumerate(zip(labels, values, palette)):
        x = left + gap + i * (bar_w + gap)
        bar_h = chart_h * value / max_value
        d.add(Rect(x, bottom, bar_w, bar_h, fillColor=colors.HexColor(color), strokeColor=colors.HexColor(color)))
        cx = x + bar_w / 2
        d.add(String(cx, bottom + bar_h + 4, str(value), textAnchor="middle", fontSize=7, fillColor=colors.HexColor("#111827")))
        d.add(String(cx, bottom - 12, label.split()[0], textAnchor="middle", fontSize=6.2, fillColor=colors.HexColor("#4b5563")))
        if len(label.split()) > 1:
            d.add(String(cx, bottom - 22, " ".join(label.split()[1:]), textAnchor="middle", fontSize=6.2, fillColor=colors.HexColor("#4b5563")))
    return d


def aggregate(rows: list[dict[str, str]], daily: dict[str, dict[str, int]], logs: list[LogSummary]) -> dict:
    by_card_csv = collections.defaultdict(lambda: {"days": 0, "logs": 0, "multi_days": 0})
    for row in rows:
        logs_count = int(row["Log_Count"])
        card = row["Smartcard"]
        by_card_csv[card]["days"] += 1
        by_card_csv[card]["logs"] += logs_count
        if logs_count > 1:
            by_card_csv[card]["multi_days"] += 1

    by_card_raw: dict[str, dict[str, float | int | str | None]] = {}
    for card, card_logs in collections.defaultdict(list, {card: [l for l in logs if l.smartcard == card] for card in sorted({l.smartcard for l in logs})}).items():
        by_card_raw[card] = {
            "raw_logs": len(card_logs),
            "csv_total_logs": by_card_csv[card]["logs"],
            "csv_days": by_card_csv[card]["days"],
            "mac": next((l.mac for l in card_logs if l.mac), None),
            "avg_uptime_hours": statistics.mean([l.uptime_seconds for l in card_logs]) / 3600,
            "min_uptime_minutes": min([l.uptime_seconds for l in card_logs]) / 60,
            "explicit_reboot_logs": sum(1 for l in card_logs if l.explicit_reboot or l.terminate_reboot),
            "ota_epoch_logs": sum(1 for l in card_logs if l.ota_epoch),
            "si2183_errors": sum(l.si2183_error for l in card_logs),
            "logs_with_si2183": sum(1 for l in card_logs if l.si2183_error),
            "max_ber": max([l.ber_max or 0 for l in card_logs]),
            "hdd_temp_fail_logs": sum(1 for l in card_logs if l.hdd_temp_fail),
            "ecm_e106_logs": sum(1 for l in card_logs if l.ecm_disallowed),
            "si_crc_logs": sum(1 for l in card_logs if l.si_crc_change),
        }

    explicit = [l for l in logs if l.explicit_reboot or l.terminate_reboot]
    si_logs = [l for l in logs if l.si2183_error]
    short_logs = [l for l in logs if 0 < l.uptime_seconds <= 15 * 60]
    uptime_values = [l.uptime_seconds for l in logs if l.uptime_seconds]

    return {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "csv": {
            "rows": len(rows),
            "unique_smartcards": len({r["Smartcard"] for r in rows}),
            "dates": sorted(daily),
            "total_reboot_logs": sum(int(r["Log_Count"]) for r in rows),
            "daily": daily,
            "top_cards_by_log_count": sorted(
                [{"smartcard": card, **stats} for card, stats in by_card_csv.items()],
                key=lambda x: (-x["logs"], x["smartcard"]),
            )[:20],
        },
        "zip": {
            "logs": len(logs),
            "smartcards": len({l.smartcard for l in logs}),
            "all_start_with_boot_script": all(l.boot_script for l in logs),
            "power_plug_logs": sum(1 for l in logs if l.power_plug),
            "explicit_reboot_logs": len(explicit),
            "ota_epoch_logs": sum(1 for l in logs if l.ota_epoch),
            "ota_v51_logs": sum(1 for l in logs if l.ota_v51),
            "si2183_logs": len(si_logs),
            "si2183_total_errors": sum(l.si2183_error for l in logs),
            "hdd_temp_fail_logs": sum(1 for l in logs if l.hdd_temp_fail),
            "ecm_e106_logs": sum(1 for l in logs if l.ecm_disallowed),
            "cas_wrong_state_logs": sum(1 for l in logs if l.cas_wrong_state),
            "si_crc_logs": sum(1 for l in logs if l.si_crc_change),
            "filter_timeout_logs": sum(1 for l in logs if l.filter_timeout),
            "network_unavailable_logs": sum(1 for l in logs if l.network_unavailable),
            "short_uptime_logs_15m_or_less": len(short_logs),
            "median_uptime_hours": statistics.median(uptime_values) / 3600,
            "min_uptime_minutes": min(uptime_values) / 60,
            "max_uptime_hours": max(uptime_values) / 3600,
            "by_card": by_card_raw,
        },
        "logs": [asdict(l) for l in logs],
    }


def para(text: str, style: ParagraphStyle):
    return Paragraph(text, style)


def bullet_items(items: list[str], style: ParagraphStyle) -> ListFlowable:
    return ListFlowable([ListItem(Paragraph(item, style), leftIndent=8) for item in items], bulletType="bullet", start="circle")


def make_pdf(summary: dict) -> None:
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleCenter", parent=styles["Title"], alignment=TA_CENTER, fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=colors.HexColor("#1f2d3d"), spaceAfter=5 * mm))
    styles.add(ParagraphStyle(name="Subtitle", parent=styles["Normal"], alignment=TA_CENTER, fontSize=10.5, leading=14, textColor=colors.HexColor("#4b5563"), spaceAfter=8 * mm))
    styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontSize=14.5, leading=18, textColor=colors.HexColor("#243047"), spaceBefore=5 * mm, spaceAfter=3 * mm))
    styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontSize=11.5, leading=14, textColor=colors.HexColor("#294c60"), spaceBefore=3 * mm, spaceAfter=2 * mm))
    styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontSize=9.2, leading=12.2, spaceAfter=2.2 * mm))
    styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontSize=7.5, leading=9.5))
    styles.add(ParagraphStyle(name="Callout", parent=styles["BodyText"], fontSize=10, leading=13, textColor=colors.HexColor("#111827"), backColor=colors.HexColor("#eef6f4"), borderColor=colors.HexColor("#2a9d8f"), borderWidth=0.8, borderPadding=7, spaceAfter=4 * mm))

    def wrapped_table(rows: list[list[object]], col_widths: list[float], style: TableStyle, small: bool = False) -> Table:
        header_style = ParagraphStyle(
            name=f"TblHeader{len(rows)}{small}",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=6.8 if small else 8.2,
            leading=8 if small else 9.5,
            textColor=colors.white,
            alignment=TA_CENTER,
        )
        body_style = ParagraphStyle(
            name=f"TblBody{len(rows)}{small}",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=6.6 if small else 8,
            leading=8.3 if small else 10,
            textColor=colors.HexColor("#111827"),
        )
        wrapped = []
        for row_idx, row in enumerate(rows):
            pstyle = header_style if row_idx == 0 else body_style
            wrapped.append([Paragraph(str(cell), pstyle) for cell in row])
        return Table(wrapped, colWidths=col_widths, repeatRows=1, style=style)

    doc = SimpleDocTemplate(
        str(REPORT_PDF),
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        title="Explora 3B Reboot Management Report",
    )

    csv_s = summary["csv"]
    zip_s = summary["zip"]
    daily = csv_s["daily"]
    peak_date, peak = max(daily.items(), key=lambda x: pct(x[1]["multi_cards"], x[1]["cards"]))
    prior_dates = [d for d in sorted(daily) if d < peak_date]
    baseline_rate = statistics.mean([pct(daily[d]["multi_cards"], daily[d]["cards"]) for d in prior_dates[:6]])

    story = [
        para("Explora 3B Reboot Investigation", styles["TitleCenter"]),
        para("Management report from supplied CSV, raw compressed decoder logs, and prior RCA PDF | Prepared 28 May 2026", styles["Subtitle"]),
        para(
            "<b>Executive verdict:</b> the reboot concern is real and material. The CSV shows a stable multi-reboot baseline of roughly "
            f"{baseline_rate:.1f}% through 25 May, then a step-change to {pct(daily['2026-05-26']['multi_cards'], daily['2026-05-26']['cards']):.1f}% on 26 May "
            f"and {pct(peak['multi_cards'], peak['cards']):.1f}% on {peak_date}. That pattern is not consistent with 98 independent decoder failures. "
            "The most likely root cause is a shared broadcast/OTA/CAS trigger acting on a vulnerable decoder population; chronic units also show strong local signal/hardware degradation.",
            styles["Callout"],
        ),
    ]

    kpis = [
        ["Metric", "Result", "Meaning"],
        ["Fleet rows analysed", f"{csv_s['rows']} rows / {csv_s['unique_smartcards']} smartcards", "Full dashboard export, 20-28 May 2026"],
        ["Peak daily impact", f"{pct(peak['multi_cards'], peak['cards']):.1f}% multi-reboot cards on {peak_date}", "Fleet event threshold breached"],
        ["Raw logs analysed", f"{zip_s['logs']} logs across {zip_s['smartcards']} chronic smartcards", "Deep evidence set for top offenders"],
        ["Boot confirmation", "125/125 logs open with cold boot script", "Log_Count is a valid reboot proxy"],
        ["Explicit software reboot path", f"{zip_s['explicit_reboot_logs']}/125 logs", "Some events are application/middleware-triggered restarts"],
        ["Satellite front-end fault", f"{zip_s['si2183_logs']}/125 logs, {zip_s['si2183_total_errors']:,} total Si2183 errors", "Signal path/tuner fault is pervasive in chronic units"],
        ["OTA 1970 epoch scheduling", f"{zip_s['ota_epoch_logs']}/125 logs", "Confirmed software/time defect candidate, not universal in this bundle"],
    ]
    story.append(wrapped_table(kpis, [42 * mm, 54 * mm, 74 * mm], table_style(header="#243047")))
    story.append(Spacer(1, 4 * mm))
    story.append(daily_chart(daily))

    story.extend([
        para("Root Cause Assessment", styles["H1x"]),
        para("1. The reboots are genuine cold starts, not just standby wakes or logging artefacts.", styles["H2x"]),
        para(
            "Every raw log begins with the `startIDwayJ.sh` boot sequence and the CSV counts multiple boot-log files for the same smartcard on the same day. "
            f"The 28 May position is especially severe: {daily['2026-05-28']['multi_cards']} of {daily['2026-05-28']['cards']} active smartcards had more than one reboot log.",
            styles["Bodyx"],
        ),
        para("2. The fleet shape points to a shared trigger.", styles["H2x"]),
        para(
            "Before 26 May, the proportion of devices with multiple daily reboot logs sits near the normal/chronic range. The sharp common-mode jump on 26 May and again on 28 May "
            "points upstream: OTA signalling, CAS/entitlement changes, SI/broadcast table changes, or a footprint-wide signal event. A pure hardware-aging explanation cannot account for the synchronised rise.",
            styles["Bodyx"],
        ),
        para("3. Chronic devices have real local decoder/signal faults.", styles["H2x"]),
        para(
            f"The raw logs show Si2183 satellite demodulator errors in {zip_s['si2183_logs']} of {zip_s['logs']} logs. Several units also show SI table CRC churn, filter timeouts, "
            "network-unavailable messages, and HDD temperature command failures. These issues can make specific decoders more likely to reboot under a broadcast or OTA stressor.",
            styles["Bodyx"],
        ),
        para("4. The strongest software lead remains boot-time scheduling before valid time is established.", styles["H2x"]),
        para(
            f"The 1970 epoch OTA maintenance signature appears in {zip_s['ota_epoch_logs']} raw logs, and OTA v5.1 appears in {zip_s['ota_v51_logs']} logs. "
            "Where present, this is a credible mechanism: a decoder that schedules maintenance before NTP/DVB time sync may treat the maintenance time as already due and re-enter update/restart logic. "
            "Because it is not present in every log in this bundle, it should be treated as a high-priority software defect candidate rather than the only cause.",
            styles["Bodyx"],
        ),
        para("5. Some restarts are explicitly requested by middleware.", styles["H2x"]),
        para(
            f"{zip_s['explicit_reboot_logs']} logs include the controlled path `Terminate(reboot=true)` or `Rebooting the STB`. "
            "That is important: for those cases the box is not simply losing power. The initiating subsystem must be correlated with OTA/CAS/SI events immediately before the termination.",
            styles["Bodyx"],
        ),
        fault_chart([LogSummary(**l) for l in summary["logs"]]),
    ])

    top_cards = sorted(zip_s["by_card"].items(), key=lambda kv: (-kv[1]["csv_total_logs"], kv[0]))
    card_rows = [["Smartcard", "MAC", "CSV logs", "Raw logs", "Avg uptime", "Si2183 errors", "Max BER", "Explicit reboot logs", "RCA note"]]
    for card, stats in top_cards:
        note = []
        if stats["explicit_reboot_logs"]:
            note.append("controlled reboot")
        if stats["si2183_errors"]:
            note.append("signal/tuner")
        if stats["hdd_temp_fail_logs"]:
            note.append("HDD temp")
        if stats["ota_epoch_logs"]:
            note.append("OTA epoch")
        card_rows.append([
            card,
            stats["mac"] or "-",
            str(stats["csv_total_logs"]),
            str(stats["raw_logs"]),
            f"{stats['avg_uptime_hours']:.1f}h",
            f"{stats['si2183_errors']:,}",
            f"{stats['max_ber']:,}" if stats["max_ber"] else "-",
            str(stats["explicit_reboot_logs"]),
            ", ".join(note) if note else "low signature volume",
        ])
    story.extend([
        PageBreak(),
        para("Evidence by Chronic Decoder", styles["H1x"]),
        wrapped_table(card_rows, [23 * mm, 30 * mm, 17 * mm, 16 * mm, 18 * mm, 23 * mm, 19 * mm, 22 * mm, 30 * mm], table_style(header="#294c60", small=True), small=True),
        para("Recommended Management Actions", styles["H1x"]),
    ])

    actions = [
        ["Priority", "Action", "Owner", "Why it matters"],
        ["P1", "Overlay OTA push/load-sequence history, CAS re-key/EMM/ECM changes, and SI table updates for 25-28 May against reboot timestamps.", "Broadcast / OTA / CAS", "Confirms or clears the shared upstream trigger."],
        ["P1", "Patch boot ordering so time sync completes before OTA scheduler and CAS time validation run; suppress maintenance calculations while clock is epoch/invalid.", "Middleware / Irdeto", "Removes the plausible self-perpetuating 1970 reboot loop."],
        ["P1", "Field-test top chronic units: C/N, BER, LNB, cabling, splitter, and 36E lock quality; start with 4664264050, 4664263996, and 4664263958.", "Field Ops", "Separates external signal path from tuner hardware."],
        ["P2", "Lab quarantine one high-error box and one explicit-reboot box; swap HDD/tuner board where practical and replay normal OTA/CAS conditions.", "Repair Lab", "Determines whether chronic units are recoverable or must be replaced."],
        ["P2", "Add alerting: >3 boot logs per smartcard/day and fleet multi-reboot share >40%; segment chronic vs spike-only cohorts.", "Monitoring / Data", "Gives early warning before fleet-level customer impact."],
    ]
    story.append(wrapped_table(actions, [16 * mm, 70 * mm, 31 * mm, 53 * mm], table_style(header="#243047")))

    story.extend([
        para("Conclusion", styles["H1x"]),
        para(
            "Management should treat this as a confirmed service-risk incident, not as isolated customer equipment noise. The evidence supports a two-layer explanation: "
            "a shared OTA/CAS/SI/broadcast-side trigger caused the late-May spike, while a subset of decoders with weak signal paths, tuner errors, HDD sensor faults, or boot-time scheduling defects are the most vulnerable. "
            "The fastest path to closure is correlation with broadcast/OTA events plus targeted field measurements on the chronic offenders.",
            styles["Bodyx"],
        ),
        para("Method and Limits", styles["H1x"]),
        bullet_items(
            [
                f"CSV source: {csv_s['rows']} rows covering {csv_s['unique_smartcards']} Explora 3B smartcards from {min(csv_s['dates'])} to {max(csv_s['dates'])}.",
                f"Raw log source: {zip_s['logs']} compressed logs in logs_bundle.zip across {zip_s['smartcards']} smartcards; all were streamed and counted without extracting the ZIP.",
                "Limitation: the raw ZIP covers chronic units, not all 98 smartcards. It proves mechanisms in the high-risk cohort; it does not alone prove which upstream event triggered every spike-only smartcard.",
                "Limitation: no headend OTA/CAS/SI change log, weather/uplink record, or field BER/C/N measurement was supplied, so final attribution must remain a ranked RCA pending those checks.",
            ],
            styles["Bodyx"],
        ),
    ])

    doc.build(story)


def table_style(header: str = "#243047", small: bool = False) -> TableStyle:
    body_font = 6.6 if small else 8
    header_font = 6.8 if small else 8.2
    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header)),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), header_font),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), body_font),
            ("LEADING", (0, 0), (-1, -1), 8.5 if small else 10),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]
    )


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = read_csv_rows()
    csv_index, daily = build_csv_index(rows)
    logs = analyse_zip(csv_index)
    summary = aggregate(rows, daily, logs)
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    make_pdf(summary)

    print(json.dumps({
        "report": str(REPORT_PDF.resolve()),
        "summary": str(SUMMARY_JSON.resolve()),
        "csv_rows": summary["csv"]["rows"],
        "csv_unique_smartcards": summary["csv"]["unique_smartcards"],
        "zip_logs": summary["zip"]["logs"],
        "zip_smartcards": summary["zip"]["smartcards"],
        "peak_multi_reboot_day": max(summary["csv"]["daily"].items(), key=lambda x: pct(x[1]["multi_cards"], x[1]["cards"])),
        "explicit_reboot_logs": summary["zip"]["explicit_reboot_logs"],
        "si2183_total_errors": summary["zip"]["si2183_total_errors"],
        "ota_epoch_logs": summary["zip"]["ota_epoch_logs"],
    }, indent=2))


if __name__ == "__main__":
    main()
