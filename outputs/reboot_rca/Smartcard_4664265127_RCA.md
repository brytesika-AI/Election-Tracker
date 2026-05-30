# Smartcard 4664265127 RCA Addendum

## Executive finding

The additional bundle for smartcard `4664265127` shows a different failure mode from the earlier raw log bundle.

This card is not rebooting because of the normal OTA maintenance scheduler, and it is not showing the tuner/SI failure pattern seen on the earlier affected devices. The strongest evidence points to an early application / middleware boot loop involving the MCAUI / WPE / Metrological browser / Netflix / OCDM path, with dynamic-data, EPG, VOD and recording-schedule database faults acting as likely triggers or amplifiers.

## Data reviewed

- Source archive: `C:\Users\bright.sikazwe\Downloads\smartcard_4664265127_logs.zip`
- Logs analysed from archive: 112
- Device MAC observed: `A0:E7:AE:DD:D1:BE`
- Dates covered in supplied logs: 2026-04-18 to 2026-05-13
- CSV total for this smartcard: 123 boot logs between 2026-04-14 and 2026-05-13

## Classification of supplied logs

| Classification | Count | Interpretation |
|---|---:|---|
| Normal OTA maintenance reboot | 2 | Expected scheduler behaviour; exclude from fault count |
| Non-OTA long / unknown prior trigger | 24 | Reboot happened, but direct prior trigger is not captured |
| Abnormal short boot session | 86 | Strong evidence of repeated fault behaviour |

The abnormal behaviour is concentrated in bursts:

| Date | Logs | Abnormal short sessions | Comment |
|---|---:|---:|---|
| 2026-05-07 | 37 | 37 | Severe boot-loop burst |
| 2026-05-08 | 7 | 6 | Continued instability |
| 2026-05-09 | 8 | 7 | Continued instability |
| 2026-05-11 | 17 | 16 | Severe boot-loop burst |
| 2026-05-13 | 20 | 18 | Severe boot-loop burst |

Most short sessions run for roughly two to three minutes and then the next boot log starts. This is not the profile of a single daily maintenance reboot.

## What this is not

The supplied smartcard logs do not support these causes as the primary root cause for this specific card:

| Suspect | Evidence in 4664265127 logs | Assessment |
|---|---:|---|
| Normal OTA maintenance scheduler | 2 clean OTA scheduler cases only | Not the cause of the repeated bursts |
| Si2183 tuner errors | 0 | Not the same tuner failure seen in other cards |
| `Si2183_L1_DD_STATUS` errors | 0 | Not a front-end lock/DD-status failure pattern |
| Power watchdog timeout | 0 | No watchdog timeout proof |
| Kernel panic / OOM / segfault | 0 | No native crash signature in captured logs |
| Secure-core download progress | 0 | Secure-core update progress is not the direct trigger here |

Secure/FlexiCore context is present: all logs show `D550-0 V10` and SecureCore version `V02`. However, there are no secure-core progress events in this card's logs, so the evidence does not show the secure-core download/install process causing the reboot loop.

## Strongest failure signatures

The short sessions are dominated by application and middleware startup noise, not RF front-end errors. The repeated terms include:

- `MCAUI`
- `BrowserManager`
- `plugin`
- `WebKit`
- `OCDM`
- `Netflix`
- `Showmax`
- `DynamicErrorMessage`
- `PackageConfigManager`
- `PCM-DBCache`
- `SQLite`
- `RecordingSchedule`
- `NullPointerException`

Representative failure lines include:

```text
initializeBrowserStack :: request came for browser initialization, but failed
initializeBrowserStack :: isStorageDeviceReady = false
initializeBrowserStack :: isInternetConnected = false
initializeBrowserStack :: isBrowserInitialized = false
```

```text
Caught class java.lang.NullPointerException while processing
```

```text
mcaui_config not present. Taking default config file :[/Systemapps/wpe/metrological/browser.conf]
```

```text
Controller.1.activate ... callsign: Netflix
ERROR_PENDING_CONDITIONS
```

```text
Pull VOD Downloader state is error
Because no disk space
```

```text
RecordingScheduleManagerEvent
invalid child recording schedule
```

Several logs also contain application crash-report records associated with Netflix/partner shutdown behaviour, including `nflx1` and crash-address style values such as `0xdeadbeef`. These are not kernel panics, but they are relevant application-layer crash/shutdown evidence.

## Root cause assessment for this smartcard

Most likely root cause:

> Smartcard `4664265127` is caught in an early middleware/application boot-loop. The trigger is most likely in the MCAUI / WPE / Metrological browser / Netflix / OCDM startup path, with corrupted or inconsistent dynamic-data, EPG/VOD/recording schedule, storage readiness, or local database state causing the application stack to fail shortly after boot.

Confidence: medium-high for application/middleware boot-loop; medium for the exact subcomponent because the captured logs end before a single definitive reset reason is written.

Why this differs from the broader bundle:

- The broader affected cohort had very high `Si2183`, SI CRC, filter timeout, CAS and PVR noise.
- This smartcard has zero `Si2183` signatures.
- This smartcard's bursts cluster around app/browser/VOD/recording schedule/database startup instead.

That means there are likely at least two reboot classes in the estate:

1. Normal OTA maintenance reboot: expected and should be excluded.
2. Abnormal reboots:
   - RF/SI/CAS/PVR instability on some cards.
   - Application/middleware boot-loop on smartcard `4664265127`.

## Recommended proof steps

To close this beyond dispute:

1. Pull persistent reset reason / bootloader reset cause for `4664265127`.
2. Decode the app crash-report payloads that reference `nflx1`, partner shutdown and `0xdeadbeef`.
3. Clear or isolate `/data/mcaui`, dynamic-data, EPG, VOD, recording schedule and local DB state on a test unit, then observe whether the boot-loop stops.
4. Check disk/storage health and free-space state, because several logs report storage not ready, not mounted, or no disk space during browser/VOD startup.
5. Compare against a healthy `D550-0 V10` / SecureCore V02 control unit to confirm that V10/V02 alone is not sufficient to cause the loop.

## Management wording

The new data does not support blaming the normal OTA maintenance scheduler. For smartcard `4664265127`, the repeated reboots are abnormal short boot sessions, mostly two to three minutes long, and they cluster around the application/browser/VOD/recording-schedule startup path. The likely root cause is an application or middleware boot-loop, probably triggered by inconsistent local application data, storage readiness, VOD/EPG/recording schedule database state, or browser/Netflix/OCDM startup failure. Secure/FlexiCore V10 is present but is not proven as the direct trigger in this card's logs.
