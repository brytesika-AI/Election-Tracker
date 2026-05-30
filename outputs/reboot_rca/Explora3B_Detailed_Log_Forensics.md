# Explora 3B Detailed Log Forensics

Prepared from `logs_bundle.zip` and `Reboots_jacques_Explora3B_ALL_Smartcards.csv` on 28 May 2026.

## Executive Technical Finding

The logs confirm that the decoders are rebooting, but the evidence separates into two different behaviours:

1. **Clean scheduled OTA maintenance reboots**: 32 of 125 raw logs contain an explicit middleware reboot path. In every one of those 32 cases, `OTAUpgradeNow` requests a reboot because maintenance time is reached.
2. **Abnormal/chronic instability**: many other logs end without a clean reboot marker and show heavy tuner/signal/CAS/SI/PVR errors. These explain why some decoders are vulnerable and why multiple boot logs per day are not just normal once-daily maintenance.

The strongest root-cause statement is therefore:

> The fleet spike is most consistent with a shared OTA/CAS/SI/broadcast-side trigger acting on a vulnerable decoder population. Some reboots are expected OTA maintenance, but the repeated same-day reboots and short sessions are abnormal and correlate strongly with satellite front-end instability, CAS entitlement/state errors, SI table churn, and boot-time OTA scheduling before valid time is established.

## Dataset Analysed

- CSV rows: 674
- Unique smartcards in CSV: 98
- CSV period: 2026-05-20 to 2026-05-28
- Raw logs in ZIP: 125 compressed boot logs
- Unique smartcards in ZIP: 9 chronic/high-volume smartcards
- All 125 raw logs open with the full `startIDwayJ.sh` cold-boot sequence.
- All 125 logs include `PWR_ON_POWER_PLUG` at startup, meaning each file is a fresh boot sequence, not just a standby wake.

## Fleet Pattern From CSV

| Date | Active smartcards | Smartcards with >1 reboot log | Total boot logs | Multi-reboot share |
|---|---:|---:|---:|---:|
| 2026-05-20 | 11 | 4 | 24 | 36.36% |
| 2026-05-21 | 85 | 19 | 113 | 22.35% |
| 2026-05-22 | 91 | 23 | 124 | 25.27% |
| 2026-05-23 | 81 | 17 | 110 | 20.99% |
| 2026-05-24 | 88 | 19 | 111 | 21.59% |
| 2026-05-25 | 90 | 24 | 122 | 26.67% |
| 2026-05-26 | 89 | 52 | 152 | 58.43% |
| 2026-05-27 | 58 | 19 | 85 | 32.76% |
| 2026-05-28 | 81 | 65 | 149 | 80.25% |

Interpretation:

- 21-25 May behaves like a chronic baseline around 21-27%.
- 26 May jumps to 58.43%.
- 28 May jumps to 80.25%.
- That shape is not consistent with independent decoder hardware failures. It points to a common-mode event: OTA, CAS/EMM/ECM, SI/broadcast table change, or signal/uplink footprint event.

## Raw Log Findings

### 1. Clean OTA Reboot Path Is Confirmed

32 of 125 logs include a clean middleware reboot path:

- `OTAUpgradeNow :: Rebooting the sytem the maintance time is reached`: 32 logs
- `Scheduler reboot request received while in state Started`: 32 logs
- `UPGRADE_FROM_MENU_ONLY`: 32 logs
- `Target state is Terminate(reboot=true)`: 32 logs
- `Rebooting the STB`: 31 logs

Representative sequence:

```text
InstallerQREngine DEBUG - controller.OTAUpgradeNow - notifyQuadrantCheckTestStatus :: Quadrant check test done and Proceed to maintainance upgrade/reboot
InstallerQREngine DEBUG - controller.OTAUpgradeNow - OTAUpgradeNow.activate() calling upgrade with UPGRADE_FROM_MENU_ONLY
InstallerQREngine DEBUG - controller.OTAUpgradeNow - OTAUpgradeNow :: Rebooting the sytem the maintance time is reached
InstallerQREngine DEBUG - controller.OTAUpgradeNow - OTAUpgradeNow :: Maintanice time from preference = 04:15
IMW-SubSystemScheduler INFO - Scheduler reboot request received while in state Started, terminate application requestId= 2
IMW-SubSystemScheduler INFO - Target state is Terminate(reboot=true) no need to terminate application, terminate subsystems
IMW-SubSystemScheduler INFO - Rebooting the STB
```

Interpretation:

- These 32 are not random power drops.
- They are controlled middleware restarts initiated by OTA maintenance logic.
- They may be expected if they occur once daily near the maintenance window.
- They are not enough to explain multiple same-day boot logs and short sessions.

### 2. Boot-Time OTA Scheduling Before Valid Time

The OTA module initializes around 7-8 seconds after boot and frequently calculates maintenance time while the system clock still reads the Unix epoch:

- `Maintenance time :: Thu Jan 01 04:15:00`: 116 logs
- Any `Thu Jan 01` OTA epoch signature: 117 logs
- OTA version `5.1`: 124 logs
- `Signalisation: 5`: present in the same OTA initialization family

Representative sequence:

```text
sdk.ota.OTAManager - ********* Version: 5.1************
sdk.ota.OTAManager - ********* Signalisation: 5**********
controller.OTAControllerNew - OTAController : Maintenance time has been set to 04:15
controller.OTAControllerNew - OTAController : Maintenance time :: Thu Jan 01 04:15:00 Africa/Kampala 1970
```

Interpretation:

- This is a real software defect candidate.
- If a scheduler treats the 1970 maintenance time as overdue, it can immediately or repeatedly enter maintenance logic.
- Even where the box later acquires real time, the early epoch calculation is unsafe and should be fixed.
- This does not prove every reboot is caused by the 1970 timestamp, but it is a high-priority bug because it is widespread in the boot logs.

### 3. Satellite Front-End / Signal Path Is Extremely Noisy

The strongest hardware/signal signature is the Si2183 satellite demodulator/tuner error:

- `Si2183 Error`: 124 of 125 logs
- Total `Si2183 Error` lines: 265,763
- `Si2183_L1_DD_STATUS ERROR`: 38 logs, 45 total
- SI physical/logical CRC churn: 121 logs, 196,021 total
- Section filter timeouts: 122 logs, 75,812 total
- `NetworkTime` being tuned away from the transponder: 124 logs, 1,492 total

Interpretation:

- This is not normal background noise at this volume.
- The decoder is constantly tuning, re-tuning, losing monitoring sessions, timing out section filters, and processing changing SI tables.
- Most likely causes: dish/LNB/cable/splitter impairment, noisy broadcast/SI conditions, tuner/demod silicon issue, or a combination.
- This can make the box more vulnerable when OTA/CAS/SI events occur.

### 4. CAS / Irdeto Entitlement State Is Unstable

Key CAS signatures:

- `DISALLOWED:E106-0`: 112 logs, 3,513 total
- `wrong state cannot start`: 112 logs, 3,331 total
- `DISALLOWED:E016-0`: 209 total
- Very high EMM traffic on `dvb://36e.ff97`
- Frequent ECM/status transitions while tuning services

Top CAS statuses extracted:

| Status | Count |
|---|---:|
| `I366-0` | 101,892 |
| `I331-0` | 101,752 |
| `CHECKING` | 11,139 |
| `ALLOWED:D029-0` | 9,960 |
| `I327-0` | 6,762 |
| `DISALLOWED:E106-0` | 3,513 |
| `E104-0` | 1,781 |
| `CLEAR:D100-0` | 1,760 |
| `ALLOWED:D126-0` | 1,031 |

Interpretation:

- CAS is not the only root cause, but it is part of the failure environment.
- CAS errors appear during/after tuning churn and around timeshift/recording state transitions.
- Engineering should verify whether Irdeto/CAS rejects, re-keying, or entitlement refreshes changed around 26-28 May.

### 5. HDD / PVR Layer Is Degraded on Many Chronic Units

Key storage/PVR signatures:

- `HDIO_DRIVE_CMD temperature sensor failed`: 93 logs, 42,202 total
- `SQLITE_INTERRUPT`: 70 logs, 346 total
- `attempt to re-open an already-closed object`: 79 logs, 706 total
- Many timeshift/recording pause and resource-loss messages

Interpretation:

- The HDD temperature sensor failure is very frequent and points to degraded PVR hardware or unsupported/failed SMART temperature reads.
- SQLite and PVR errors are likely secondary stress symptoms unless they occur immediately before reboot.
- They can still reduce stability, especially during timeshift/recording while the tuner/CAS path is unstable.

### 6. Uptime Distribution Shows This Is Not a Fixed 7.5-Second Loop

Raw log uptime buckets:

| Uptime bucket | Log count |
|---|---:|
| 0-5 minutes | 8 |
| 5-15 minutes | 6 |
| 15-60 minutes | 15 |
| 1-6 hours | 42 |
| 6-24 hours | 44 |
| >24 hours | 10 |

Interpretation:

- The fleet is not in one uniform reboot loop.
- Some sessions die very quickly.
- Some run for many hours and then perform a clean OTA maintenance reboot.
- Some logs end during ongoing tuner/CAS/SI/PVR errors without a clean final reboot marker.

### 7. What The Logs Do Not Support

The following are absent or not supported as primary causes:

- No `Kernel panic`
- No `OutOfMemoryError`
- No killed process evidence
- No segfault / segmentation fault evidence
- No general assert failure evidence
- `watchdog` mostly appears as normal subsystem unregistering during shutdown. Only 2 logs include a power watchdog timeout line, so it is not the fleet-wide cause.
- The startup `FATAL - No Module class specified` lines appear in all 125 logs, so they are baseline boot noise, not a differentiator.
- The prior BER claim is not reproducible from this ZIP as a reliable numeric BER extraction; most `BER` text hits in this bundle are substrings inside SQL/query text, not clear bit-error-rate measurements.

## Per-Decoder Forensic Summary

| Smartcard | MAC | Raw logs | Avg uptime | Clean OTA reboot logs | Si2183 errors | HDD temp-fail logs | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| 4664264050 | 78:6A:1F:E5:A9:F6 | 42 | 1.58h | 4 | 21,669 | 35 | Most frequent logger; short sessions; heavy HDD/signal issues |
| 4664263996 | 78:6A:1F:F0:48:5E | 21 | 5.37h | 0 | 25,833 | 18 | No clean OTA reboot marker in bundle; heavy CAS E106 |
| 4664263958 | 78:6A:1F:F0:47:BE | 13 | 2.56h | 0 | 7,747 | 13 | Short sessions; heavy SI/CAS/PVR churn |
| 4664265104 | C0:89:AB:ED:3B:47 | 10 | 16.43h | 6 | 44,492 | 10 | Long runs, then clean OTA maintenance reboot |
| 4671199079 | 0C:7F:B2:D8:4C:25 | 10 | 20.36h | 7 | 54,773 | 10 | Mostly long runs plus scheduled OTA reboot |
| 4664264086 | 78:6A:1F:F0:48:FB | 8 | 19.35h | 4 | 38,146 | 3 | Long-run unit; explicit maintenance reboot in half the logs |
| 4664265184 | A4:98:13:55:34:D1 | 8 | 21.97h | 6 | 39,881 | 0 | Long-run unit; clean OTA reboot dominant |
| 4664264683 | 78:6A:1F:E5:A9:68 | 7 | 6.45h | 2 | 9,856 | 3 | Mixed signal/CAS plus some clean OTA reboots |
| 4664263783 | C0:89:AB:ED:45:2D | 6 | 16.96h | 3 | 23,366 | 1 | Long-run unit; clean OTA reboot present |

## Root-Cause Ranking

### Rank 1: OTA maintenance scheduler behaviour

Evidence:

- 32 clean reboot cases are all initiated by `OTAUpgradeNow`.
- The reboot reason is explicitly `maintenance time is reached`.
- The preference is consistently `04:15`.
- Boot-time maintenance calculation often occurs while clock is still at 1970.

Conclusion:

- Confirmed initiator for the clean reboot subset.
- Possible contributor to repeated reboots if the epoch-time bug causes maintenance to be treated as overdue.
- Needs code fix/guard: do not run OTA maintenance scheduling until trusted time is available.

### Rank 2: Shared broadcast/CAS/SI event around 26-28 May

Evidence:

- Fleet multi-reboot share jumps from baseline to 58.43% and then 80.25%.
- SI CRC churn, filter timeouts, EMM/ECM updates, and CAS rejects are all heavy in the raw logs.

Conclusion:

- Most likely explanation for the fleet spike.
- Requires headend evidence to close: OTA package schedule, load sequence, SI table updates, EMM/ECM re-key schedule, and uplink/transponder alarms.

### Rank 3: Local signal/tuner path vulnerability

Evidence:

- Si2183 demodulator errors in 124/125 logs.
- L1 status failures in 38 logs.
- Constant tune aborts, monitoring cancels, and filter timeouts.

Conclusion:

- Very strong chronic-unit contributor.
- Field measurements are required to separate dish/LNB/cabling/splitter from tuner-board failure.

### Rank 4: PVR/HDD degradation

Evidence:

- HDD temperature sensor command failures in 93/125 logs.
- SQLite and PVR/timeshift errors common.

Conclusion:

- Likely not the single fleet root cause, but a stability amplifier.
- Replace/swap HDD on chronic units during lab quarantine to verify.

## Recommended Engineering Checks

1. Pull OTA scheduler logs/headend schedule for 25-28 May and compare with reboot timestamps.
2. Confirm whether OTA v5.1 / signalisation 5 was changed, re-broadcast, or had package integrity issues.
3. Fix boot sequencing: block OTA schedule decisions until trusted NTP/DVB time is available.
4. Check whether 04:15 maintenance is expected to reboot daily. If yes, classify those as normal unless more than once per day.
5. For same-day repeats, focus on the non-clean logs and short sessions.
6. Pull CAS/Irdeto change history for EMM/ECM re-key, E106/E016 status changes, and entitlement refreshes around 26-28 May.
7. Field-test the worst chronic units for C/N, BER, LNB voltage, cabling, splitters, and lock stability on 36E transponders.
8. Lab-test one short-session unit and one clean-OTA-reboot unit separately, because they are probably different failure modes.

## Bottom Line

The decoder reboot concern is real, but the logs do not support a single simple cause such as "all boxes are faulty." The evidence supports a layered incident:

- clean scheduled OTA reboots are happening and may be normal once per day;
- an OTA time/scheduler defect is visible and should be fixed;
- the fleet spike needs correlation with shared headend OTA/CAS/SI events;
- chronic devices have serious signal/tuner and PVR/HDD instability that makes them much more likely to fail under the shared trigger.

