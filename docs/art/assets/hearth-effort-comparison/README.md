# Hearth · single medium versus packed max

Partial result, November 6, 2026: the single-medium Cub returned; the MAX batch
connection closed without an SVG or usage response. The MAX-quality comparison
remains unavailable and its billing is unknown.

Agreed November 6, 2026. The user authorized one single Cub at medium effort and
the original twelve-scene batch at MAX effort, after finding the first packed
Squire and Cub below the quality bar. This is a two-request comparison, without
automatic retries. Current game artwork stays unchanged until selection and
runtime review.

## Requests and comparison

| Variant                    | Subject/layout                                  | Image quality | SVG author    | Reasoning |
| -------------------------- | ----------------------------------------------- | ------------- | ------------- | --------- |
| Original retained baseline | Twelve scenes, 1920 × 1008                      | medium        | `gpt-6.1-sol` | low       |
| Single Cub                 | One normal Cub, 1280 × 896                      | high          | `gpt-6.1-sol` | medium    |
| Repeated original batch    | Same twelve-scene prompt and 1920 × 1008 layout | medium        | `gpt-6.1-sol` | max       |

All use `gpt-image-2.6-sunburst`, high image complexity, native SVG output and
`n=1`. The [author model](https://developers.openai.com/api/docs/models/gpt-6.1-sol)
supports both medium and max; the [generation reference](https://developers.openai.com/api/reference/resources/images/methods/generate)
separates SVG-author reasoning from image complexity/quality. Existing key reuse
remains authorized; credentials are unchanged and never stored in these records.

The repeat batch copies the original sent request, changing only
`svg.reasoning.effort` from low to max. The API generates a fresh internal raster
reference, so this does not fix the underlying reference image or isolate all
variation. The single Cub also changes prompt focus, per-subject canvas and image
quality. Judge usefulness, anatomy, readable gesture, consistency and actual cost;
do not attribute every difference to reasoning effort alone.

The [original batch and user rejection](../hearth-small-units-batch/README.md)
remain intact. Preserve every new original, exact prompt/request, usage, ID,
extraction and review output under the [current hold](../../README.md#image-26-batch-workflow).
The source checkpoint is `5122332` on `codex/hearth-packed-small-units`. Working
material is in `.artifacts/hearth-effort-comparison-2026-11-06/`.

## Review plan

Inspect the full MAX sheet before extracting its twelve cells. Compare normal
Cub across current art, original low-effort sheet, MAX sheet and medium single;
compare Golden Cub and both Squires against the original low-effort cells.
Check connected muzzle/neck/shoulder, joints, planted paws and weight before
decoration, at full size, 160 × 112, 80 × 56 and 64 × 45. Record all remaining
failures rather than accepting the more expensive result automatically. Report
total cost and per usable scene, including the other MAX-sheet subjects. Neither
generation agreement nor technical decoding establishes artwork acceptance.

## Single medium result; MAX sheet unavailable

Request `req_3c9a77ba075e46b2a67017386fa28e6c` completed in 208.80 seconds.
Image usage: 711 text input and 1,284 image output tokens. SVG author usage:
2,298 input and 9,895 output tokens, including 262 reasoning tokens.
Estimated USD **$0.145621** using the same standard rates as the original trial.
The raw [SVG](single-medium.svg), [exact prompt](single-cub-prompt.md),
[request](single-medium-request.json), and [response](single-medium-response.json)
are preserved. The original has a 1280 × 896 viewBox, 97 paths and 22,073 bytes.

Initial author observation: the muzzle, cheek, shoulder and near paw use more
continuous curves than the rejected low-effort cell. The far foreleg remains
straight and the large eyes give a young mascot-like expression. Keep this as
an unaccepted candidate; a larger, denser SVG does not establish convincing
anatomy or actual board suitability.

## MAX transport failure

The MAX attempt raised `http.client.RemoteDisconnected`: the remote end closed
the connection without an HTTP response. It returned **no SVG, request ID or
usage**. It was last confirmed pending at 573 seconds and observed failed at
649 seconds; the exact completion time is unknown (roughly ten minutes). The
client read timeout was 1,800 seconds, and the request already ran through the
approved network path. No authentication, quota or model-access error was
returned. The evidence does not identify whether the remote closure came from
the service or an intermediary.

The [exact MAX request](batch-max-request.json),
[unchanged original prompt](batch-max-prompt.md), and
[failure record](batch-max-error.json) are retained. No automatic retry was made.
MAX billing is **unknown**; no response does not establish no charge. The single
medium's $0.145621 is the known successful-request estimate, not a verified total
for both attempts.

The [comparison](comparison.webp) and [64 × 45 view](small-board.webp) explicitly
label the unavailable MAX column. There is no MAX-quality verdict or direct
completed medium-versus-MAX comparison. Current art, original low-effort sources
and the single-medium candidate remain available. Another paid attempt requires
a new decision, with the transport failure and possible duplicate cost taken
into account; the failed request is not silently rerolled.
