# Built-in CV builder

ai-job-search compiles CVs with LaTeX; this pack does not require it. The
`cv/` folder ships a single-page HTML template and a renderer that prints it
to PDF with a real browser engine (Edge or Chrome, already on the machine).
Rendering adapted from [cvhtml2doc](https://github.com/ahmedmetered/cvhtml2doc)
(MIT), which exists because pixel-faithful, ATS-parseable CVs do not need a
TeX distribution.

## Pipeline

1. Copy `cv/template.html` into the candidate's data folder as
   `cv-<company>.html`.
2. Fill every placeholder from the profile, tailored per
   `applications.md`: mirror only true requirements, lead with evidence,
   cut the weakest bullet instead of shrinking the font.
3. Render: `node cv/print_pdf.mjs cv-<company>.html cv-<company>.pdf`
   (auto-finds Edge, then Chrome, then chromium on Linux).
4. Optional layout audit: `python cv/audit_layout.py cv-reference.pdf
   cv-<company>.pdf` when a reference CV must be matched numerically.
5. Optional ATS text check: `pip install pypdf`, then extract the PDF text and
   confirm the posting's key terms actually appear. If both pypdf and Poppler
   are missing, do a visual keyword pass instead and say so.

## Rules the template enforces

- Single column, standard section names (Experience, Education, Skills):
  parsers and recruiters both read it without guessing.
- Real text only, no text-in-images, no icon fonts: extractable by ATS.
- One page at A4 with the template's margins. If content overflows, cut the
  weakest bullet; never shrink below 10pt.
- Dates and locations right-aligned per entry, so the eye can scan tenure.

## Editable DOCX variant

When the candidate needs to keep editing in Word, use the `build_docx.example.mjs`
pattern from cvhtml2doc (docx npm package, font embedding, twip metrics). The
HTML/PDF pair is the default; the DOCX route is for candidates whose target
employers demand Word files.
