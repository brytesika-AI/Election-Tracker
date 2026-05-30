# Final RCA - Normal OTA Maintenance Excluded

## Correction

The `OTAUpgradeNow` / `maintenance time is reached` sequence is normal OTA maintenance behaviour and should not be treated as a fault by itself.

Expected/normal sequence:

```text
OTAUpgradeNow :: Rebooting the sytem the maintance time is reached
OTAUpgradeNow :: Maintanice time from preference = 04:15
Scheduler reboot request received while in state Started
Target state is Terminate(reboot=true)
Rebooting the STB
```

Therefore, these clean OTA maintenance reboots must be excluded from the incident count unless the same decoder is rebooting more than once per day or outside the expected maintenance behaviour.

## Reclassified Raw Logs

Expanded raw bundle: 585 logs.

| Classification | Count | Interpretation |
|---|---:|---|
| Normal OTA maintenance reboot | 169 | Expected maintenance path; not root cause by itself |
| Abnormal short session, no clean shutdown marker | 38 | Strongest evidence of fault behaviour |
| Non-OTA boot log, no clean reboot marker in previous captured session | 378 | Reboot happened, but direct final trigger is not captured in the log |

Important limitation:

- A debug log generally starts after the decoder has already rebooted.
- If the previous session died abruptly, the actual final trigger may not be recorded.
- So we can prove the clean OTA maintenance reboots are normal, but the exact trigger of every non-clean reboot is not always directly logged.

## What Remains After Removing Normal OTA

For non-OTA / abnormal logs only:

| Signature | Count |
|---|---:|
| `Si2183 Error` | 597,773 |
| SI CRC churn | 194,380 |
| Filter timeouts | 159,199 |
| HDD temperature sensor failures | 94,404 |
| `DISALLOWED:E106` | 10,844 |
| SQLite already-closed errors | 2,140 |
| Secure-core progress events | 1,366 |
| SQLite interrupts | 920 |
| Security ABI verify errors | 57 |
| Power watchdog timeout | 5 |

## Actual Cause Assessment

The clean OTA scheduler is not the cause.

The most likely cause of the abnormal repeated boot logs is:

> Unstable satellite front-end / SI table / CAS / PVR state causing non-clean decoder restarts or failed sessions, with some units much more vulnerable than others.

The strongest technical evidence is:

1. **Satellite front-end instability**
   - Very high `Si2183 Error` volume.
   - `Si2183_L1_DD_STATUS ERROR` present.
   - Constant tune/monitoring churn.

2. **Broadcast SI instability or poor SI reception**
   - Very high SI CRC churn.
   - High section filter timeouts.
   - `NetworkTime` frequently tuned away or interrupted.

3. **CAS/Irdeto instability under tuner/SI churn**
   - `DISALLOWED:E106` and `E016` events.
   - Wrong-state CAS starts.
   - EMM/ECM activity during service/timeshift changes.

4. **PVR/HDD stress as amplifier**
   - HDD temperature sensor failures.
   - SQLite interrupted / already-closed query errors.
   - Timeshift and key-material events around service changes.

5. **Secure-core / IFCP is a context trigger, not sufficient alone**
   - Post-upgrade secure-core progress appears in the expanded logs.
   - But the PostBootUp control population shows many non-rebooting cards also have `D550-0 V10`.
   - Therefore V10 alone does not cause reboot; it may amplify or expose failures on vulnerable boxes.

## Final RCA Wording

Use this wording:

> The normal OTA maintenance reboot at 04:15 is not the fault. After excluding that expected path, the abnormal reboot evidence points to a vulnerable subset of decoders suffering satellite front-end/SI/CAS/PVR instability. These boxes generate extra boot logs and short sessions because tuner/SI/CAS state is unstable, with PVR/HDD and secure-core/IFCP activity acting as amplifiers. The incident should be investigated as signal/SI/CAS/PVR instability in a vulnerable decoder cohort, not as normal OTA maintenance and not as random independent hardware failure.

## Recommended Next Proof

To close the root cause beyond dispute:

1. Pull kernel/persistent crash reason from affected devices, if available.
2. Pull signal metrics for affected cards: C/N, BER, lock loss, LNB voltage, tuner lock failures.
3. Compare affected cards against a non-rebooting `D550-0 V10` control group.
4. Inspect headend SI/EMM/ECM events on spike dates.
5. Get raw logs for `4664265127`, the biggest post-upgrade deterioration in the CSV.
6. For short-session cards, capture serial/kernel logs before reboot, not only post-boot debug logs.

