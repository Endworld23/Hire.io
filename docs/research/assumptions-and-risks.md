# Assumptions & Risks

**Document purpose**
This document explicitly records the core assumptions underpinning Hire.io and the primary risks associated with those assumptions. It exists to:

* Prevent implicit or unexamined beliefs from shaping product decisions
* Make tradeoffs and uncertainties explicit
* Provide a reference for roadmap prioritization and future course-correction

This document should be read alongside:

* `docs/research/market-validation.md`
* `roadmap.md`
* `architecture.md`
* `security-and-eeo.md`

---

## 1. Core Market Assumptions

### A1. Hiring dissatisfaction is structural, not cyclical

**Assumption**
The widespread dissatisfaction with modern hiring (ghosting, opacity, ATS frustration, distrust) is driven by structural forces rather than a temporary post-pandemic anomaly.

**Rationale**

* Job tenure remains historically low relative to past decades
* Non-linear careers and cross-industry movement are now normalized
* Automation and compliance pressures continue to increase, not decrease

**Risk if false**
If dissatisfaction recedes as labor markets tighten or loosen cyclically, demand for transparency-focused tooling may weaken or be deprioritized by employers.

**Mitigation**

* Anchor Hire.io’s value not only in candidate sentiment, but in employer efficiency, signal quality, and compliance readiness
* Ensure early features reduce measurable employer costs (time-to-fill, noise)

---

### A2. Employers want to be more transparent but are constrained

**Assumption**
Most employers do not intend to dehumanize candidates; opacity is a byproduct of scale, legal risk, and operational constraints.

**Rationale**

* Recruiters cite applicant volume and legal exposure as primary blockers
* Silence and generic responses are often safer than bespoke communication

**Risk if false**
If employers are largely indifferent to candidate experience, transparency features may be underutilized or disabled.

**Mitigation**

* Design transparency as an efficiency and risk-reduction tool, not a moral obligation
* Make transparency the path of least resistance (default workflows)

---

### A3. Trust can reduce hiring noise

**Assumption**
Improved job clarity, integrity signals, and explainable processes will reduce low-quality applications and improve match efficiency.

**Rationale**

* Candidates mass-apply largely due to uncertainty and lack of feedback
* Clear expectations and realistic requirements discourage low-fit applicants

**Risk if false**
If application volume does not meaningfully decrease, Hire.io could add process overhead without delivering efficiency gains.

**Mitigation**

* Measure application quality ratios, not just volume
* Allow employers to tune strictness vs openness (e.g., leniency/training controls)

---

### A4. Non-linear careers are economically rational

**Assumption**
Frequent role and industry changes are rational responses to economic volatility, skill mismatches, and displacement—not individual failure.

**Rationale**

* Credential inflation outpaces formal training access
* Layoffs and restructuring normalize career resets

**Risk if false**
If employers strongly prefer linear career narratives regardless of evidence, non-linear modeling may see limited adoption.

**Mitigation**

* Position non-linear modeling as an optional expansion lever, not mandatory ideology
* Provide employer-controlled thresholds for adjacency and trainability

---

### A5. Compliance pressure will continue to increase

**Assumption**
AI-assisted hiring regulation and enforcement will expand over time, increasing demand for auditability, transparency, and documented decision logic.

**Rationale**

* NYC AEDT law sets a precedent
* EEOC and state-level scrutiny of algorithmic hiring is rising

**Risk if false**
If regulation stalls or weakens, compliance features may be perceived as unnecessary overhead.

**Mitigation**

* Frame compliance tooling as operational clarity and governance, not just legal defense
* Ensure features provide value even without regulatory mandates

---

## 2. Product & Platform Assumptions

### A6. Explainability can be delivered without harming employers

**Assumption**
It is possible to provide candidates with meaningful explanations without increasing legal exposure or recruiter workload.

**Risk if false**
If explainability materially increases liability or operational cost, employers may resist adoption.

**Mitigation**

* Use category-based, non-evaluative explanations
* Maintain immutable audit trails and consistent language

---

### A7. Integrity signaling will not deter legitimate employers

**Assumption**
Requiring freshness, intent attestation, or posting integrity indicators will not meaningfully reduce employer participation.

**Risk if false**
Employers may avoid Hire.io if posting requirements are perceived as friction.

**Mitigation**

* Make integrity signals lightweight and proportional
* Allow staged adoption (soft indicators before hard enforcement)

---

### A8. Hire.io can coexist with ATS/HRIS ecosystems

**Assumption**
Hire.io will augment rather than replace existing ATS/HRIS systems, reducing integration resistance.

**Risk if false**
Deep replacement requirements could slow adoption and sales cycles.

**Mitigation**

* Design Hire.io as a trust/compliance layer that integrates outward
* Avoid early dependence on full system replacement

---

## 3. Strategic & Go-To-Market Risks

### R1. Being perceived as ideological or moralizing

**Risk**
Hire.io could be framed as “anti-employer,” “anti-automation,” or politically charged.

**Mitigation**

* Maintain neutral, systems-focused language
* Emphasize efficiency, compliance, and clarity over values rhetoric

---

### R2. Overpromising candidate outcomes

**Risk**
Candidates may assume Hire.io guarantees responses, fairness, or job offers.

**Mitigation**

* Avoid outcome guarantees in product language
* Frame features as transparency and process improvement, not success assurance

---

### R3. Feature creep driven by empathy

**Risk**
Attempting to solve every candidate pain point could dilute focus and slow execution.

**Mitigation**

* Prioritize features that benefit both candidates and employers
* Require evidence-based justification for new scope

---

### R4. Enterprise compliance complexity

**Risk**
Enterprise customers may demand extensive customization, audits, or controls early.

**Mitigation**

* Sequence compliance depth by phase
* Target SMBs and regulated-but-agile sectors first

---

## 4. Explicit Non-Goals (Guardrails)

Hire.io explicitly does NOT assume:

* That AI can or should make final hiring decisions
* That bias can be fully eliminated through tooling alone
* That transparency guarantees fairness
* That employers and candidates have identical incentives

These non-goals are intentional and protective.

---

## 5. How This Document Should Be Used

* Revisited at each roadmap phase gate
* Updated when assumptions are invalidated
* Referenced during major product or positioning debates
* Used to explain *why* certain tradeoffs were accepted

Assumptions left undocumented become blind spots. This document exists to keep Hire.io honest.
