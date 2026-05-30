# Explora 3B Reboot RCA - Expanded Data With 20 April Secure-Core Upgrade Anchor

Inputs:

- `Reboots_jacques_Explora3B_ALL_Smartcards (1).csv`
- `logs_bundle (1).zip`
- Known event supplied by operations: secure-core upgrade performed on **20 April 2026**

## Executive Finding

The expanded dataset strengthens the case that the issue is not random decoder hardware failure.

The CSV shows a chronic reboot baseline before the 20 April secure-core upgrade, then a higher and more volatile post-upgrade period with immediate spikes on 22 April and 24 April, and later major spikes on 26 May and 28 May.

The raw logs show that IFCP / secure-core V10 signalling is present in the affected population, and actual secure-core download progress appears only after the upgrade anchor in this dataset.

Most defensible position:

> The 20 April secure-core upgrade is not proven to be the only cause, but it is now a strong common-trigger candidate. The logs show IFCP image-status `D550-0 V10`, decoder secure-core statuses still below V10, post-upgrade secure-core download progress from 0% to 100%, post-upgrade security ABI errors, and OTA maintenance reboots. This points to a secure-core / IFCP / OTA / CAS interaction affecting an already vulnerable population with tuner/SI/PVR instability.

## CSV Before/After Pattern

Upgrade date used as anchor: **20 April 2026**.

Pre-upgrade period in CSV: 13-19 April 2026.

Post-upgrade period in CSV: 20 April-28 May 2026.

| Metric | Pre-upgrade | Post-upgrade |
|---|---:|---:|
| Days in CSV | 7 | 36 |
| Average daily multi-reboot share | 22.53% | 29.36% |
| Raw-log files in ZIP | 86 | 499 |
| Short raw-log sessions <=15 min | 2 / 86 = 2.3% | 36 / 499 = 7.2% |
| Clean OTA maintenance reboot logs | 22 / 86 = 25.6% | 147 / 499 = 29.5% |
| Security ABI verify errors | 6 | 57 |
| Secure-core download progress events | 0 | 3,173 |

Interpretation:

- There was already a pre-upgrade chronic baseline, so the upgrade did not create all reboot behaviour from zero.
- The post-upgrade period is worse: higher average multi-reboot share, more short sessions, more security ABI errors, and all observed secure-core download progress.
- This supports a "trigger plus vulnerable population" model rather than a single simple failure mode.

## Daily Fleet Trend

| Date | Active smartcards | Multi-reboot smartcards | Total logs | Multi-reboot share | Period |
|---|---:|---:|---:|---:|---|
| 2026-04-13 | 10 | 1 | 12 | 10.00% | Pre |
| 2026-04-14 | 86 | 23 | 124 | 26.74% | Pre |
| 2026-04-15 | 86 | 23 | 124 | 26.74% | Pre |
| 2026-04-16 | 83 | 23 | 132 | 27.71% | Pre |
| 2026-04-17 | 80 | 18 | 113 | 22.50% | Pre |
| 2026-04-18 | 81 | 18 | 115 | 22.22% | Pre |
| 2026-04-19 | 78 | 17 | 106 | 21.79% | Pre |
| 2026-04-20 | 78 | 15 | 102 | 19.23% | Post |
| 2026-04-21 | 82 | 23 | 129 | 28.05% | Post |
| 2026-04-22 | 84 | 48 | 145 | 57.14% | Post |
| 2026-04-23 | 46 | 8 | 54 | 17.39% | Post |
| 2026-04-24 | 81 | 45 | 136 | 55.56% | Post |
| 2026-04-28 | 57 | 13 | 92 | 22.81% | Post |
| 2026-04-29 | 85 | 27 | 122 | 31.76% | Post |
| 2026-04-30 | 84 | 20 | 113 | 23.81% | Post |
| 2026-05-01 | 87 | 16 | 109 | 18.39% | Post |
| 2026-05-02 | 84 | 17 | 104 | 20.24% | Post |
| 2026-05-03 | 86 | 13 | 108 | 15.12% | Post |
| 2026-05-04 | 90 | 28 | 139 | 31.11% | Post |
| 2026-05-05 | 90 | 31 | 137 | 34.44% | Post |
| 2026-05-06 | 85 | 31 | 128 | 36.47% | Post |
| 2026-05-07 | 88 | 27 | 163 | 30.68% | Post |
| 2026-05-08 | 90 | 36 | 151 | 40.00% | Post |
| 2026-05-09 | 85 | 34 | 152 | 40.00% | Post |
| 2026-05-10 | 87 | 20 | 118 | 22.99% | Post |
| 2026-05-11 | 87 | 21 | 145 | 24.14% | Post |
| 2026-05-12 | 82 | 18 | 128 | 21.95% | Post |
| 2026-05-13 | 91 | 29 | 153 | 31.87% | Post |
| 2026-05-14 | 83 | 17 | 113 | 20.48% | Post |
| 2026-05-15 | 86 | 17 | 106 | 19.77% | Post |
| 2026-05-16 | 86 | 19 | 123 | 22.09% | Post |
| 2026-05-17 | 80 | 18 | 106 | 22.50% | Post |
| 2026-05-18 | 83 | 11 | 98 | 13.25% | Post |
| 2026-05-19 | 86 | 23 | 121 | 26.74% | Post |
| 2026-05-20 | 88 | 18 | 120 | 20.45% | Post |
| 2026-05-21 | 85 | 19 | 113 | 22.35% | Post |
| 2026-05-22 | 91 | 23 | 124 | 25.27% | Post |
| 2026-05-23 | 81 | 17 | 110 | 20.99% | Post |
| 2026-05-24 | 88 | 19 | 111 | 21.59% | Post |
| 2026-05-25 | 90 | 24 | 122 | 26.67% | Post |
| 2026-05-26 | 89 | 52 | 152 | 58.43% | Post |
| 2026-05-27 | 58 | 19 | 85 | 32.76% | Post |
| 2026-05-28 | 82 | 66 | 152 | 80.49% | Post |

Important:

- The first major post-upgrade spike is **22 April**, two days after the upgrade anchor.
- The second is **24 April**.
- The late-May spike remains severe and cannot be dismissed as a one-day anomaly.

## Secure-Core / IFCP Evidence

### IFCP V10 image status

Raw logs contain:

```text
Received IFCP CA Message : image-status=[(I01) D550-0   V  10 ] packages-download-progress-info=[]
```

Counts:

- Pre-upgrade: 86 occurrences in 86 raw logs.
- Post-upgrade: 490 occurrences in 499 raw logs.

Nuance:

- V10 image status is already visible before 20 April.
- Therefore, the upgrade date is not the first appearance of V10 signalling.
- It may represent image availability/carousel advertisement before activation, or logs may capture V10 status before the formal upgrade date.
- Engineering must define exactly what `D550-0 V10` means in Irdeto/IFCP terms.

### Decoder secure-core versions are below V10

Secure-core status versions observed by smartcard:

| Smartcard | Secure-core version in status |
|---|---:|
| 4664263996 | V01 |
| 4664264086 | V01 |
| 4664263958 | V03 |
| 4671199079 | V04 |
| 4664264050 | V05 |
| 4664263783 | V08 |
| 4664264683 | V08 |
| 4664265104 | V09 |
| 4664265184 | V09 |

Interpretation:

- Affected devices are not all on the same secure-core version.
- They are all below V10 while seeing IFCP image-status V10.
- This supports a rollout / migration / compatibility hypothesis.

### Secure-core download progress appears only post-upgrade in this dataset

Pre-upgrade:

- 0 progress events.

Post-upgrade:

- 3,173 progress events.
- 7 raw logs show progress from 0% to 100%.

Logs with 0%-100% secure-core progress:

| Date | Smartcard/log | Max progress | Clean OTA reboot in same log? |
|---|---|---:|---|
| 2026-05-07 | `4664264086_combined_debug_00196.log.gz` | 100% | Yes |
| 2026-05-07 | `4664265184_combined_debug_00704.log.gz` | 100% | Yes |
| 2026-05-20 | `4664263958_combined_debug_00760.log.gz` | 100% | No |
| 2026-05-20 | `4664263996_combined_debug_00225.log.gz` | 100% | No |
| 2026-05-20 | `4664263996_combined_debug_00226.log.gz` | 100% | No |
| 2026-05-20 | `4664264683_combined_debug_00991.log.gz` | 100% | Yes |
| 2026-05-20 | `4664265104_combined_debug_00399.log.gz` | 100% | Yes |

Interpretation:

- Secure-core download activity is real, not theoretical.
- It appears post-upgrade in this log set.
- Some logs with progress later enter clean OTA reboot; others continue without an immediate clean reboot.
- This means secure-core progress is a strong trigger/correlate but not a sufficient cause by itself.

## OTA Reboot Evidence

Clean OTA maintenance reboot remains confirmed:

- Pre-upgrade raw logs: 22 / 86 = 25.6%.
- Post-upgrade raw logs: 147 / 499 = 29.5%.

The exact sequence remains:

```text
OTAUpgradeNow :: Rebooting the sytem the maintance time is reached
OTAUpgradeNow :: Maintanice time from preference = 04:15
Scheduler reboot request received while in state Started, terminate application requestId= 2
Target state is Terminate(reboot=true)
Rebooting the STB
```

Interpretation:

- Clean reboot cases are controlled by OTA maintenance logic.
- Once-per-day clean maintenance reboot may be expected.
- Multiple same-day boot logs and short sessions are not explained by normal maintenance.

## Security ABI / Key Handling Evidence

Security ABI verification errors:

- Pre-upgrade: 6.
- Post-upgrade: 57.

Examples include:

```text
!!!Error (0x6) at ... nexus_security_abiverify_client.h:317
```

and:

```text
!!!Error (0x6) at ... nexus_security_abiverify_client.h:438
```

Context:

- These occur around CA/key material, demux keyslot, PVR/timeshift playback, and service transitions.
- They are not in every log, so they are not the sole fleet cause.
- The post-upgrade increase makes them relevant to the secure-core / IFCP hypothesis.

## Signal / CAS / SI Instability Still Matters

The secure-core evidence does not remove the signal/CAS/SI finding. It explains why the same broadcast/security event may affect some decoders worse than others.

Raw ZIP totals:

| Signature | Pre-upgrade | Post-upgrade |
|---|---:|---:|
| `Si2183 Error` | 186,638 | 1,148,044 |
| `Si2183_L1_DD_STATUS ERROR` | 33 | 183 |
| `HDIO_DRIVE_CMD temperature sensor failed` | 26,859 | 170,163 |
| `DISALLOWED:E106` | 3,656 | 14,009 |
| `DISALLOWED:E016` | 198 | 884 |
| SI CRC churn | 3,272 | 451,913 |
| Filter timeouts | 43,899 | 308,754 |
| SQLite already-closed object | 580 | 3,125 |

Interpretation:

- The decoders are under heavy tuner/SI/CAS/PVR stress.
- The jump in SI CRC churn after the upgrade period is especially large.
- A secure-core/IFCP/CAS event over a weak signal/SI environment is more plausible than independent box failures.

## Device-Level Notes

Top post-vs-pre CSV increases by logs per active day:

| Smartcard | Pre logs/day | Post logs/day | Lift | Note |
|---|---:|---:|---:|---|
| 4664265127 | 2.33 | 5.74 | +3.40 | Biggest lift, but not included in raw ZIP |
| 4664265104 | 1.57 | 2.32 | +0.75 | In raw ZIP; secure-core progress on 20 May |
| 4664263851 | 1.20 | 1.92 | +0.72 | Not in raw ZIP |
| 4664264050 | 3.43 | 4.09 | +0.66 | In raw ZIP; chronic high-volume logger |
| 4664265106 | 1.17 | 1.69 | +0.52 | Not in raw ZIP |

Important request:

- If skeptics want the strongest post-upgrade evidence, obtain raw logs for `4664265127`.
- It is the biggest post-upgrade deterioration in the CSV but is absent from the supplied ZIP.

## What This Proves And Does Not Prove

Proves:

- The reboot issue existed before 20 April but worsened/changed after it.
- IFCP V10 image status is present across the raw logs.
- Affected boxes show secure-core statuses below V10.
- Actual secure-core download progress appears post-upgrade in the supplied data.
- Clean reboot cases are triggered by OTA maintenance logic.
- The same population shows heavy signal/SI/CAS/PVR instability.

Does not prove yet:

- That secure-core V10 alone caused every reboot.
- That all V10 IFCP messages are upgrade activation messages.
- That every short/non-clean reboot was caused by secure-core.

## Best RCA Wording

Use this wording internally:

> The expanded dataset supports a layered RCA. A chronic reboot baseline existed before the 20 April secure-core upgrade, but the post-upgrade period is worse and includes all observed secure-core download-progress activity, more security ABI errors, more short sessions, and multiple fleet spikes. The logs show devices below secure-core V10 receiving IFCP image-status V10, with OTA maintenance initiating controlled reboots. The most likely explanation is a secure-core / IFCP / OTA / CAS rollout interaction affecting decoders already vulnerable due to tuner/SI/PVR instability. This should not be closed as isolated decoder hardware failure without correlating the secure-core rollout, IFCP carousel, OTA maintenance schedule, and CAS/SI changes.

## Immediate Follow-Up Evidence Needed

1. Secure-core V10 rollout schedule and target cohort.
2. Meaning of `D550-0 V10` from Irdeto/IFCP.
3. Meaning of `D500-0 Vxx` and whether Vxx is active secure-core version.
4. Expected action after `secureCoreDownloadProgressInfo` reaches 100%.
5. Whether activation requires reboot and whether it should use the 04:15 OTA maintenance path.
6. Headend IFCP carousel logs for 20-24 April, 7 May, 20 May, 26 May, and 28 May.
7. CAS/EMM/ECM change records for the same dates.
8. Raw logs for `4664265127`, because it has the biggest post-upgrade deterioration in the CSV.

