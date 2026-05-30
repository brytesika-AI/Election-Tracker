# PostBootUp 2026-05-28 Control Population Analysis

Input:

- `PostBootUp_2026_05_28_classified (1).xlsx`

Purpose:

- Test whether the May 28 post-boot classification file supports or weakens the secure-core / IFCP / OTA hypothesis.

## Key Finding

This workbook appears to be a **control/comparison population**, not the rebooting cohort.

After normalising smartcard IDs, there is **zero overlap** between:

- the 1,209 smartcards in the PostBootUp workbook; and
- the 82 smartcards in the 2026-05-28 reboot CSV.

Therefore, this workbook cannot directly explain which of the May 28 rebooting cards failed. It can, however, tell us what the wider/non-reboot snapshot looked like after boot.

## Population Summary

| Metric | Count |
|---|---:|
| Total rows | 1,209 |
| Rows with CA status | 1,044 |
| Blank CA-status rows | 165 |
| Direct overlap with May 28 reboot CSV | 0 |

The workbook methodology excludes blank CA-status cards from its main calculation, so the active analysed population is 1,044.

## Window Classification

Window used by source workbook: **03:05-04:00 local device time**.

Active CA-status population only:

| Window category | Cards | Share |
|---|---:|---:|
| before | 547 | 52.39% |
| within | 65 | 6.23% |
| after | 432 | 41.38% |

Interpretation:

- Only 6.23% of active cards were in the 03:05-04:00 local window.
- Most post-boot CA-status events were before or after the window.
- This window is not the same as the `04:15` OTA maintenance time seen in the raw decoder logs, but it is close enough to remain operationally relevant.

## CA Status

Active population:

| CA status | Cards | Share |
|---|---:|---:|
| D029-0 | 958 | 91.76% |
| D100-0 | 48 | 4.60% |
| E016-0 | 24 | 2.30% |
| E143-0 | 6 | 0.57% |
| E166-0 | 6 | 0.57% |
| E018-0 | 1 | 0.10% |
| E103-0 | 1 | 0.10% |

Interpretation:

- The majority of the control population reached an allowed/normal-looking CA status.
- A minority, 8.24%, had non-`D029-0` statuses.
- `E016-0` exists in the control population, so seeing E016 alone is not enough to prove reboot cause.

## SecureCore And FlexiCore

All 1,044 active cards have:

```text
CCADetails_FlexiCore = (I01) D550-0   V  10
```

SecureCore versions are spread across V01-V09:

| SecureCore version | Active cards | Share |
|---|---:|---:|
| V01 | 91 | 8.72% |
| V02 | 109 | 10.44% |
| V03 | 102 | 9.77% |
| V04 | 99 | 9.48% |
| V05 | 116 | 11.11% |
| V06 | 117 | 11.21% |
| V07 | 116 | 11.11% |
| V08 | 94 | 9.00% |
| V09 | 99 | 9.48% |
| Blank/unparsed | 101 | 9.67% |

Interpretation:

- FlexiCore/IFCP `D550-0 V10` is fleet-wide in this post-boot population.
- Devices can show FlexiCore V10 while SecureCore remains V01-V09.
- Therefore, `D550-0 V10` by itself is **not sufficient** to prove a decoder will reboot.
- The better RCA is still an interaction model: secure-core/IFCP rollout plus OTA scheduling plus CAS/SI/tuner/PVR instability.

## What This Changes In The RCA

This workbook weakens any claim that:

> "D550-0 V10 alone causes reboot."

It strengthens the more defensible claim that:

> "D550-0 V10 is a common broadcast/IFCP state across the population. The failing cohort must have an additional differentiator, such as secure-core download/activation timing, OTA maintenance reboot path, security ABI/keyslot errors, CAS errors, SI churn, tuner instability, HDD/PVR stress, or a combination."

## How To Use This With Skeptics

Use this carefully:

- Do not say the PostBootUp file proves the reboot root cause.
- Do say it proves the environment is broadly on FlexiCore/IFCP V10 while SecureCore versions vary.
- Do say it provides a control population: many cards can survive post-boot with FlexiCore V10.
- Therefore, the RCA should focus on the **difference between surviving V10 cards and rebooting V10-exposed cards**.

## Recommended Next Join

To close the evidence gap, request a PostBootUp extract for the actual May 28 reboot smartcards, especially:

- `4676188069`
- `4664265059`
- `4667096405`
- `4671197255`
- `4664263783`
- `4664263958`
- `4664263996`
- `4664265127`

The supplied PostBootUp file has none of those rebooting smartcards, so it cannot answer whether their post-boot CA status, SecureCore version, or window category differed from the control population.

