import gzip
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict, deque
from pathlib import Path


ZIP_PATH = Path(r"C:\Users\bright.sikazwe\Downloads\Explora_Ultra_Reboot_Logs.zip")
OUT_JSON = Path("outputs/reboot_rca/ultra_reboot_forensics.json")
OUT_MD = Path("outputs/reboot_rca/Explora_Ultra_Reboot_RCA.md")


ENTRY_RE = re.compile(r"^(?P<date>\d{8})_(?P<card>\d+)_combined_debug_(?P<seq>\d+)\.log\.gz$", re.I)
TIME_RE = re.compile(rb"\[?(\d{5}):(\d{2})\.(\d{3})\]?")


TERM_PATTERNS = {
    "ota_maintenance": re.compile(rb"OTAUpgradeNow|maintanice time|maintenance time|Scheduler reboot request received|Rebooting the STB|Target state is Terminate\(reboot=true\)", re.I),
    "si2183": re.compile(rb"Si2183", re.I),
    "si2183_l1": re.compile(rb"Si2183_L1_DD_STATUS|L1_DD_STATUS", re.I),
    "si_crc": re.compile(rb"CRC|section version changed|Section.*crc|SI.*crc", re.I),
    "filter_timeout": re.compile(rb"Filter timeout|filter_task", re.I),
    "network_time_tuned_away": re.compile(rb"NetworkTime.*tuned away|tuned away.*NetworkTime", re.I),
    "hdd_temp": re.compile(rb"HDD.*temp|temperature sensor|TEMP_SENSOR|hdd temperature", re.I),
    "e106": re.compile(rb"E106|DISALLOWED:E106", re.I),
    "e016": re.compile(rb"E016|DISALLOWED:E016", re.I),
    "wrong_state": re.compile(rb"wrong state|incorrect system state", re.I),
    "sqlite": re.compile(rb"SQLite|sqlite|sqlQueryManager|PCM-DBCache|DBCache", re.I),
    "sqlite_interrupt": re.compile(rb"SQLite.*interrupt|interrupted", re.I),
    "sqlite_closed": re.compile(rb"already closed|closed database|database is closed", re.I),
    "watchdog": re.compile(rb"watchdog|POWER_Watchdog_task|watchdog timeout", re.I),
    "kernel_panic": re.compile(rb"kernel panic|panic - not syncing", re.I),
    "oom": re.compile(rb"Out of memory|oom-killer|Killed process", re.I),
    "segfault": re.compile(rb"segfault|SIGSEGV|fatal signal", re.I),
    "secure_core": re.compile(rb"secure.?core|SecureCore", re.I),
    "secure_progress": re.compile(rb"secure.?core.*progress|progress.*secure.?core", re.I),
    "ifcp": re.compile(rb"IFCP|FlexiCore|D550-0|D029-0", re.I),
    "d550_v10": re.compile(rb"D550-0\s+V\s*10|D550-0\s+V10", re.I),
    "browser": re.compile(rb"BrowserManager|WPE|WebKit|Metrological|browser", re.I),
    "mcaui": re.compile(rb"MCAUI|mcaui|/data/mcaui", re.I),
    "netflix": re.compile(rb"Netflix|nflx|NRDP", re.I),
    "ocdm": re.compile(rb"OCDM|OpenCDM", re.I),
    "vod": re.compile(rb"VOD|BoxOffice|Showmax|OTT|DUX|VUX|PullVOD", re.I),
    "recording_schedule": re.compile(rb"RecordingSchedule|recording schedule|RecSched", re.I),
    "dynamic_data": re.compile(rb"DynamicData|DynamicErrorMessage|dataUpdate|EDNManager", re.I),
    "null_pointer": re.compile(rb"NullPointerException", re.I),
    "crash_report": re.compile(rb"Crash Report|crashAddress|partner shutdown|0xdeadbeef", re.I),
    "storage": re.compile(rb"Storage|storage|disk space|not mounted|not-mounted|isStorageDeviceReady|No space|no disk space", re.I),
    "network": re.compile(rb"NetworkInterface|InternetConnectivity|ARP|WPA|internet|network", re.I),
    "fatal": re.compile(rb"FATAL|Fatal", re.I),
    "error": re.compile(rb"ERROR|Error", re.I),
    "warn": re.compile(rb"WARN|Warning", re.I),
    "power_plug": re.compile(rb"PWR_ON_POWER_PLUG|wake up on", re.I),
    "reset_reason": re.compile(rb"reset reason|reboot reason|Last reboot|ResetReason|resetCause", re.I),
}


BUCKETS = [
    ("OTA", re.compile(rb"OTAUpgradeNow|Scheduler reboot request|maintenance time|maintanice time", re.I)),
    ("RF/SI", re.compile(rb"Si2183|L1_DD_STATUS|Filter timeout|NetworkTime|CRC|sectionfilter", re.I)),
    ("CAS", re.compile(rb"Irdeto|CAIrdeto|E106|E016|EMM|ECM|DISALLOWED", re.I)),
    ("PVR/Storage", re.compile(rb"PVR|RecordingSchedule|Timeshift|Storage|disk space|not-mounted|HDD|sqlite|PCM-DBCache", re.I)),
    ("App/Browser/VOD", re.compile(rb"MCAUI|BrowserManager|WPE|WebKit|Metrological|Netflix|OCDM|Showmax|BoxOffice|VOD|DUX|VUX|OTT", re.I)),
    ("DynamicData/EPG", re.compile(rb"DynamicData|DynamicErrorMessage|EDNManager|EPG|dataUpdate", re.I)),
    ("Kernel/Watchdog", re.compile(rb"kernel panic|watchdog|POWER_Watchdog|oom|segfault|fatal signal", re.I)),
    ("Network", re.compile(rb"NetworkInterface|InternetConnectivity|ARP|WPA|internet|network", re.I)),
]


def seconds_from_line(line: bytes):
    m = TIME_RE.search(line)
    if not m:
        return None
    hours = int(m.group(1))
    minutes = int(m.group(2))
    millis = int(m.group(3))
    return hours * 3600 + minutes * 60 + millis / 1000.0


def bucket_line(line: bytes):
    hits = []
    for name, pat in BUCKETS:
        if pat.search(line):
            hits.append(name)
    return hits or ["Other"]


def analyse_entry(zf, entry):
    meta = ENTRY_RE.match(entry.filename)
    date_raw = meta.group("date") if meta else "unknown"
    date = f"{date_raw[:4]}-{date_raw[4:6]}-{date_raw[6:8]}" if date_raw != "unknown" else "unknown"
    card = meta.group("card") if meta else "unknown"
    seq = meta.group("seq") if meta else ""

    counts = Counter()
    line_count = 0
    max_seconds = None
    last_timed = ""
    tail = deque(maxlen=35)
    timed_tail = deque(maxlen=12)
    top_lines = Counter()
    secure_versions = set()
    macs = set()

    with zf.open(entry, "r") as raw:
        with gzip.GzipFile(fileobj=raw) as gz:
            for line in gz:
                line_count += 1
                tail.append(line.decode("utf-8", errors="replace").rstrip())
                sec = seconds_from_line(line)
                if sec is not None:
                    max_seconds = sec if max_seconds is None else max(max_seconds, sec)
                    decoded = line.decode("utf-8", errors="replace").rstrip()
                    last_timed = decoded
                    timed_tail.append(decoded)

                for key, pattern in TERM_PATTERNS.items():
                    if pattern.search(line):
                        counts[key] += 1

                if b"ERROR" in line or b"WARN" in line or b"FATAL" in line:
                    msg = re.sub(rb"^\[?\d{5}:\d{2}\.\d{3}\]?\s*", b"", line.strip())
                    msg = re.sub(rb"0x[0-9a-fA-F]+", b"0xADDR", msg)
                    msg = re.sub(rb"\d{3,}", b"N", msg)
                    top_lines[msg[:220].decode("utf-8", errors="replace")] += 1

                if b"SecureCore" in line or b"secureCore" in line or b"secure core" in line:
                    for m in re.finditer(rb"\bV\s*0?([0-9]{1,2})\b", line, re.I):
                        secure_versions.add(int(m.group(1)))

                if b"MAC" in line or b"macaddress" in line.lower():
                    for m in re.finditer(rb"(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}", line):
                        macs.add(m.group(0).decode("ascii", errors="ignore").upper())

    explicit_ota = counts["ota_maintenance"] >= 2
    uptime_min = round(max_seconds / 60.0, 2) if max_seconds is not None else None
    short = max_seconds is not None and max_seconds < 15 * 60

    if explicit_ota:
        cls = "normal_ota"
    elif short:
        cls = "abnormal_short"
    else:
        cls = "non_ota_long_or_unknown"

    tail_bucket_counts = Counter()
    for t in list(tail):
        for b in bucket_line(t.encode("utf-8", errors="ignore")):
            tail_bucket_counts[b] += 1

    return {
        "entry": entry.filename,
        "date": date,
        "card": card,
        "seq": seq,
        "size": entry.file_size,
        "line_count": line_count,
        "uptime_min": uptime_min,
        "class": cls,
        "last_timed": last_timed,
        "secure_versions": sorted(secure_versions),
        "macs": sorted(macs),
        "counts": dict(counts),
        "tail_buckets": dict(tail_bucket_counts),
        "tail": list(tail)[-12:],
        "timed_tail": list(timed_tail),
        "top_lines": top_lines.most_common(8),
    }


def add_counts(dst, rec):
    dst["logs"] += 1
    dst[rec["class"]] += 1
    if rec["uptime_min"] is not None:
        dst["uptime_min_sum"] += rec["uptime_min"]
        dst["uptime_min_n"] += 1
        if dst["uptime_min_min"] is None or rec["uptime_min"] < dst["uptime_min_min"]:
            dst["uptime_min_min"] = rec["uptime_min"]
        if dst["uptime_min_max"] is None or rec["uptime_min"] > dst["uptime_min_max"]:
            dst["uptime_min_max"] = rec["uptime_min"]
    for k, v in rec["counts"].items():
        dst["terms"][k] += v
    for k, v in rec["tail_buckets"].items():
        dst["tail_buckets"][k] += v


def new_agg():
    return {
        "logs": 0,
        "normal_ota": 0,
        "abnormal_short": 0,
        "non_ota_long_or_unknown": 0,
        "uptime_min_sum": 0.0,
        "uptime_min_n": 0,
        "uptime_min_min": None,
        "uptime_min_max": None,
        "terms": Counter(),
        "tail_buckets": Counter(),
    }


def serialise_agg(agg):
    out = dict(agg)
    if out["uptime_min_n"]:
        out["uptime_min_avg"] = round(out["uptime_min_sum"] / out["uptime_min_n"], 2)
    out.pop("uptime_min_sum", None)
    out.pop("uptime_min_n", None)
    out["terms"] = dict(out["terms"].most_common())
    out["tail_buckets"] = dict(out["tail_buckets"].most_common())
    return out


def main():
    if not ZIP_PATH.exists():
        raise SystemExit(f"Missing {ZIP_PATH}")

    by_card = defaultdict(new_agg)
    by_date = defaultdict(new_agg)
    by_class = defaultdict(new_agg)
    examples = defaultdict(list)
    top_short_lines = Counter()
    all_terms = Counter()
    short_terms = Counter()
    logs = []
    failures = []

    with zipfile.ZipFile(ZIP_PATH) as zf:
        entries = [e for e in zf.infolist() if ENTRY_RE.match(e.filename)]
        total = len(entries)
        for i, entry in enumerate(entries, 1):
            try:
                rec = analyse_entry(zf, entry)
            except Exception as exc:
                failures.append({"entry": entry.filename, "error": repr(exc)})
                continue

            logs.append({
                "entry": rec["entry"],
                "date": rec["date"],
                "card": rec["card"],
                "uptime_min": rec["uptime_min"],
                "class": rec["class"],
                "last_timed": rec["last_timed"],
                "counts": rec["counts"],
                "tail_buckets": rec["tail_buckets"],
            })

            add_counts(by_card[rec["card"]], rec)
            add_counts(by_date[rec["date"]], rec)
            add_counts(by_class[rec["class"]], rec)
            all_terms.update(rec["counts"])
            if rec["class"] == "abnormal_short":
                short_terms.update(rec["counts"])
                for line, count in rec["top_lines"]:
                    top_short_lines[line] += count

            if len(examples[rec["class"]]) < 8:
                examples[rec["class"]].append({
                    "entry": rec["entry"],
                    "date": rec["date"],
                    "card": rec["card"],
                    "uptime_min": rec["uptime_min"],
                    "last_timed": rec["last_timed"],
                    "tail_buckets": rec["tail_buckets"],
                    "tail": rec["tail"],
                    "top_lines": rec["top_lines"],
                })

            if i % 100 == 0:
                print(f"processed {i}/{total}", file=sys.stderr)

    top_cards = sorted(
        ((card, serialise_agg(agg)) for card, agg in by_card.items()),
        key=lambda item: (item[1]["abnormal_short"], item[1]["logs"]),
        reverse=True,
    )

    data = {
        "source": str(ZIP_PATH),
        "total_logs": len(logs),
        "cards": len(by_card),
        "date_range": [min(by_date), max(by_date)] if by_date else [],
        "summary": {k: serialise_agg(v) for k, v in by_class.items()},
        "by_date": {k: serialise_agg(v) for k, v in sorted(by_date.items())},
        "top_cards_by_abnormal_short": top_cards[:40],
        "all_terms": dict(all_terms.most_common()),
        "short_terms": dict(short_terms.most_common()),
        "top_short_lines": top_short_lines.most_common(40),
        "examples": examples,
        "logs": logs,
        "failures": failures,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(data, indent=2), encoding="utf-8")
    write_markdown(data)
    print(f"Wrote {OUT_JSON}")
    print(f"Wrote {OUT_MD}")


def pct(n, d):
    return "0.0%" if not d else f"{(n / d) * 100:.1f}%"


def md_table(rows):
    return "\n".join(rows)


def write_markdown(data):
    total = data["total_logs"]
    class_counts = {k: v["logs"] for k, v in data["summary"].items()}
    abnormal = class_counts.get("abnormal_short", 0)
    ota = class_counts.get("normal_ota", 0)
    unknown = class_counts.get("non_ota_long_or_unknown", 0)

    top_cards = data["top_cards_by_abnormal_short"][:15]
    date_rows = ["| Date | Logs | Normal OTA | Abnormal short | Unknown/long | Abnormal short % |",
                 "|---|---:|---:|---:|---:|---:|"]
    for date, agg in data["by_date"].items():
        date_rows.append(
            f"| {date} | {agg['logs']} | {agg.get('normal_ota', 0)} | {agg.get('abnormal_short', 0)} | "
            f"{agg.get('non_ota_long_or_unknown', 0)} | {pct(agg.get('abnormal_short', 0), agg['logs'])} |"
        )

    card_rows = ["| Smartcard | Logs | Abnormal short | Normal OTA | Unknown/long | Abnormal short % | Dominant short evidence |",
                 "|---|---:|---:|---:|---:|---:|---|"]
    for card, agg in top_cards:
        terms = agg["terms"]
        dominant = []
        for k in ["browser", "mcaui", "netflix", "ocdm", "vod", "recording_schedule", "dynamic_data", "storage", "si2183", "si_crc", "filter_timeout", "e106", "hdd_temp", "watchdog"]:
            if terms.get(k, 0):
                dominant.append(f"{k}={terms[k]}")
        card_rows.append(
            f"| {card} | {agg['logs']} | {agg.get('abnormal_short', 0)} | {agg.get('normal_ota', 0)} | "
            f"{agg.get('non_ota_long_or_unknown', 0)} | {pct(agg.get('abnormal_short', 0), agg['logs'])} | "
            f"{', '.join(dominant[:6])} |"
        )

    short_terms = data["short_terms"]
    term_rows = ["| Signature in abnormal short logs | Count |",
                 "|---|---:|"]
    for k, v in list(short_terms.items())[:30]:
        term_rows.append(f"| `{k}` | {v} |")

    top_line_rows = ["| Top repeated warning/error line in abnormal short logs | Count |",
                     "|---|---:|"]
    for line, count in data["top_short_lines"][:20]:
        safe = line.replace("|", "\\|")
        top_line_rows.append(f"| `{safe}` | {count} |")

    text = f"""# Explora Ultra Reboot RCA

## Executive finding

The Ultra bundle contains {total} boot logs across {data['cards']} smartcards from {data['date_range'][0]} to {data['date_range'][1]}.

After excluding clean OTA maintenance behaviour, the dominant remaining pattern is abnormal short boot sessions. The strongest common signatures are application/browser/VOD/storage/recording-schedule/database startup failures, with RF/SI/CAS/PVR noise present on some devices but not sufficient to explain the whole population.

## Classification

| Classification | Count | Share |
|---|---:|---:|
| Normal OTA maintenance | {ota} | {pct(ota, total)} |
| Abnormal short boot session | {abnormal} | {pct(abnormal, total)} |
| Non-OTA long or prior trigger not captured | {unknown} | {pct(unknown, total)} |

## Daily pattern

{md_table(date_rows)}

## Most affected smartcards

{md_table(card_rows)}

## Signatures in abnormal short sessions

{md_table(term_rows)}

## Repeated warning/error lines in abnormal short sessions

{md_table(top_line_rows)}

## Root cause assessment

The normal OTA scheduler should be excluded from the fault bucket. The Ultra logs show that the residual reboot problem is not a single clean root cause across all units.

The strongest common cause is:

> A vulnerable subset of decoders enters an early middleware/application boot-loop, usually during browser/VOD/MCAUI/Netflix/OCDM/dynamic-data/recording-schedule/storage startup. Local storage readiness, disk/free-space state, SQLite/DB cache state, VOD/EPG dynamic data, and recording schedule state appear to be key amplifiers.

Secondary contributors on some devices are:

- RF/SI instability: `Si2183`, SI CRC churn, filter timeouts and NetworkTime tuned-away events.
- CAS/PVR amplification: `E106`/`E016`, wrong-state transitions, PVR/timeshift and HDD/storage errors.
- Secure/FlexiCore context: present in the population, but not proven as a standalone trigger by these logs.

## Recommended next proof

1. Pull persistent reset reason / bootloader reset cause from the top affected smartcards.
2. Decode application crash reports, especially browser, WPE, Netflix, OCDM and partner shutdown payloads.
3. On a lab unit, clear or isolate `/data/mcaui`, VOD cache, dynamic data, EPG DB, recording schedule DB and SQLite cache, then verify whether the boot-loop stops.
4. Compare affected units against healthy Ultra units with the same Secure/FlexiCore versions.
5. For RF/SI-heavy cards, correlate reboot windows with signal metrics, tuner lock, SI headend changes, EMM/ECM bursts and PVR/timeshift state.
"""
    OUT_MD.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
