# Explora 3B Secure-Core Deep Dive

Prepared after the additional note that a secure-core upgrade was recently performed.

## Revised Position

The secure-core clue is significant. The logs do not merely contain generic security libraries; they show IFCP / Irdeto secure-core state and image-status messages on nearly every boot.

The strongest revised hypothesis is:

> A secure-core / IFCP image broadcast is a credible common trigger for the late-May reboot spike. The boxes see IFCP image status `D550-0 V 10` while their secure-core status is still at lower versions (`V01` to `V09`). OTA maintenance then initiates clean reboots, and vulnerable boxes with tuner/CAS/SI/PVR instability may repeat the cycle or fail abnormally.

This does not yet prove the secure-core upgrade is the sole root cause. It does, however, make secure-core upgrade correlation a priority check.

## Secure-Core Evidence Found

### 1. IFCP image status V10 is present almost everywhere

The raw logs contain:

- `Received IFCP CA Message : image-status=[(I01) D550-0   V  10 ] packages-download-progress-info=[]`
- Present in 124 of 125 logs.
- Total count: 124.

Example:

```text
00000:04.520 [IMW-CAS#IfcpSubSystem] INFO - imw.ca.ifcp.engine -
Received IFCP CA Message : image-status=[(I01) D550-0   V  10 ] packages-download-progress-info=[]
```

Interpretation:

- The headend/CAS path is advertising IFCP image status version 10 to the decoders.
- This is exactly the kind of shared signal that can explain a fleet-wide date spike better than random box failure.

### 2. Decoder secure-core versions are lower than V10

The secure-core status embedded in the Cloaked CA card data shows versions below V10:

| Smartcard | Secure-core version seen in `secureCoreStatus` | Raw logs |
|---|---:|---:|
| 4664263996 | V01 | 21 |
| 4664264086 | V01 | 8 |
| 4664263958 | V03 | 13 |
| 4671199079 | V04 | 10 |
| 4664264050 | V05 | 42 |
| 4664263783 | V08 | 6 |
| 4664264683 | V08 | 7 |
| 4664265104 | V09 | 10 |
| 4664265184 | V09 | 8 |

Representative line:

```text
Cloaked CA card: sn=4664264050, ver=5.0.2-5, vendorIds=[0x6e6],
secureCoreStatus="(I02) D500-0 M05 m04 mode01 N00 C01 S00 V05 T00
(I02) D500-0 M05 m05 mode01 N00 C02 S00 V05 T00
(I01) D500-0 M05 m04 mode01 N00 C01 S00 V05 T00",
secureCoreDownloadProgressInfo=""
```

Interpretation:

- The logs show boxes below V10 while receiving image-status V10.
- That matches the recent secure-core upgrade clue.
- This should be correlated with the secure-core rollout cohort and schedule.

### 3. One box logs secure-core download progress from 0% to 100%

Smartcard `4664263958` / log `combined_debug_00760.log.gz` shows live secure-core download progress:

- Progress starts at 0% around uptime `00019:46`.
- Progress reaches 100% around uptime `00021:20`.
- 437 `secureCoreDownloadProgressInfo` progress events were logged.
- This was not a clean OTA reboot log and was not a short crash session; it continued running afterward.

Representative start:

```text
00019:46.484 [IMW-CAS#CAIrdeto] INFO - imw.ca.irdeto.engine.cca -
Updated Cloaked CA data ... secureCoreStatus="... V03 ..."
secureCoreDownloadProgressInfo="(I02)   0% M05 m05 mode01 N00 C02 S00"
```

Representative completion:

```text
00021:20.332 [IMW-CAS#CAIrdeto] INFO - imw.ca.irdeto.engine.cca -
Updated Cloaked CA data ... secureCoreStatus="... V03 ..."
secureCoreDownloadProgressInfo="(I02) 100% M05 m05 mode01 N00 C02 S00"
```

Immediately around the completion, the box also logs:

```text
IMW-CANotifier ERROR - pcm.dbcache.subsystem -
Unable to update active CA system ID since the received CA system ID is zero or existing.

DUXGroupSet ERROR - Exception while update Group Cache from query Result
java.lang.IllegalStateException: attempt to re-open an already-closed object: SQLiteQuery...
```

Interpretation:

- Secure-core download activity can trigger repeated CA smartcard update callbacks and downstream database/cache churn.
- This one log alone does not prove it rebooted the box, because the session continued for hours.
- But it proves the secure-core upgrade path is active in the supplied logs and interacts with CA/database subsystems.

### 4. Loader and signing metadata look abnormal but not conclusively causal

All logs show loader/security state:

- `LoaderCoreAPI_GetUKInfo result = 0`: 125 logs.
- `IrdetoLoaderStatus`: loader version 5.1.
- `signatureVersion = 0x0`.
- `signTime=1858/11/19 03:00:00`.
- `downloadTime=1858/11/19 03:00:00`.

Representative:

```text
IrdetoLoaderStatus[manufacturerId=0x2, hardwareVersion=0x25, systemId=0xffff,
keyVersion=0x0, keyStatus=0x0, signatureVersion=0x0, variant=0x2,
downloadId=199, CSSN=..., loaderVersion=5.1,
signTime=1858/11/19 03:00:00, downloadTime=1858/11/19 03:00:00,
isignVersion=6.2.0]
```

Interpretation:

- The 1858 dates and `signatureVersion=0x0` are suspicious but may be default/unset fields.
- Do not use them as the primary RCA unless Irdeto confirms these fields should be valid.
- They do support the broader concern that security/loader metadata is being processed with invalid or placeholder time fields.

### 5. Security ABI verification errors exist but are rare

Only one log contains `nexus_security_abiverify_client` errors:

- File: `4664264050_combined_debug_01211.log.gz`
- Error 1: `!!!Error (0x6) ... nexus_security_abiverify_client.h:317`
- Error 2: `!!!Error (0x6) ... nexus_security_abiverify_client.h:438`

Context:

```text
IMW-TimeShiftPlayer ... internalOnKeyMaterialReceived ...
!!!Error (0x6) at ... nexus_security_abiverify_client.h:317
DMUX_PID_PRIV: DMUX_PID_P_AddKeySlot ... already waiting to be assigned
```

And later:

```text
IMW-CA ... CA service stopped dvb://36e.ff96.bb9
!!!Error (0x6) at ... nexus_security_abiverify_client.h:438
```

Interpretation:

- This is not fleet-wide in the supplied ZIP, so it is not the main root cause by itself.
- It is highly relevant to engineering because it ties security ABI/keyslot handling to PVR/timeshift playback and CA transitions.
- It may be a symptom of secure-core/IFCP changes interacting with PVR key material.

## How This Changes The RCA

Before the secure-core clue, the leading explanation was:

- OTA scheduler + CAS/SI/broadcast trigger + tuner/signal vulnerability.

After the secure-core clue, the sharper explanation is:

- The shared broadcast-side trigger may specifically be the secure-core/IFCP image version 10 rollout.
- The logs show decoders below V10 receiving IFCP image-status V10.
- One decoder downloads secure-core data from 0% to 100%.
- The clean reboots are still initiated by OTA maintenance logic.
- The abnormal repeats likely occur when secure-core/IFCP/CA updates combine with tuner/SI/CAS instability and unsafe boot-time scheduling.

## What To Ask The Skeptics / Engineering Team For

To prove or disprove this decisively, ask for:

1. Exact secure-core V10 rollout start/end times.
2. Target cohort: were these 98 smartcards included?
3. Whether `D550-0 V 10` means "image available", "image downloaded", "image pending activation", or another Irdeto state.
4. Whether `D500-0 Vxx` is the active secure-core version.
5. Expected decoder action after secure-core download reaches 100%: reboot, standby, activation on next boot, or no action.
6. Whether V01/V03/V04/V05/V08/V09 devices require sequential upgrades or can jump to V10.
7. Known defects for Irdeto loader 5.1 / secure-core V10 / IFCP key handling / `nexus_security_abiverify_client`.
8. Whether `secureCoreDownloadProgressInfo` is expected to be empty in normal operation.
9. Headend EMM/IFCP carousel logs for 25-28 May.
10. CAS error trends for `E106`, `E016`, `E104`, and key material delivery during the rollout.

## Most Defensible Statement

Use this wording if people challenge the RCA:

> The logs do not prove that secure-core V10 alone caused every reboot, but they do prove that the secure-core/IFCP path was active in the affected population. In 124 of 125 raw logs the decoder receives IFCP image-status `D550-0 V10`, while the decoder secure-core status remains on lower versions. One unit logs secure-core download progress from 0% to 100%. The clean reboot cases are initiated by OTA maintenance, and the non-clean cases show heavy tuner/CAS/SI/PVR instability. Therefore the secure-core rollout is a leading common-trigger hypothesis and must be correlated against the fleet reboot spike before closing this as hardware or signal only.

