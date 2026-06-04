import React, { useEffect, useMemo, useRef, useState } from "react";
import Base from "../Components/Base";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

// ─── Utility helpers ─────────────────────────────────────────────────────────

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateForInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const isoMatch = typeof value === "string" && value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateForPayload = (value, formCode, isUpdateMode) => {
  if (!value) return "";
  if (formCode === "BASIC") {
    if (isUpdateMode) {
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toISOString().slice(0, 10);
    }
    if (typeof value === "string" && /^\d{2}-\d{2}-\d{4}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
};

const getStatusStyle = (status) =>
  ({
    ACTIVE: { background: "#16a34a", color: "#fff" },
    INACTIVE: { background: "#6b7280", color: "#fff" },
    PENDING: { background: "#f59e0b", color: "#111827" },
    SUBMITTED: { background: "#2563eb", color: "#fff" },
    COMPLETED: { background: "#0f766e", color: "#fff" },
  }[status] || { background: "#e5e7eb", color: "#111827" });

const addDaysToDate = (value, offsetDays) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + Number(offsetDays || 0));
  return date.toISOString().slice(0, 10);
};

const parseValidationError = (message) => {
  if (!message || typeof message !== "string")
    return { message: "Please check the highlighted fields.", fieldCode: null };
  const validationMatch = message.match(/Validation failed:\s*\[(.*)\]\s*$/i);
  if (!validationMatch) return { message, fieldCode: null };
  const rawItems = validationMatch[1]
    .split(/,\s*(?=[A-Z0-9_]+\s*\()/)
    .map((i) => i.trim())
    .filter(Boolean);
  const parsedItems = rawItems
    .map((item) => {
      const m = item.match(/^([A-Z0-9_]+)\s*\((.*?)\):\s*(.*)$/);
      if (!m) return null;
      return { code: m[1], label: m[2].trim(), reason: m[3].trim().replace(/\.$/, "") };
    })
    .filter(Boolean);
  if (!parsedItems.length) return { message: "Please check the highlighted fields.", fieldCode: null };
  const labels = parsedItems.map((i) => i.label);
  return {
    fieldCode: parsedItems[0].code,
    message:
      parsedItems.length === 1
        ? `${labels[0]} is required.`
        : `Please fill these required fields: ${labels.join(", ")}.`,
  };
};

const resolveComputedValue = (question, values, beneficiary) => {
  if (!question?.computed) return values[question.code] ?? "";
  if (question.computed.kind === "DATE_OFFSET") {
    const src = question.computed.sourceQuestionCode;
    const srcVal = values[src] ?? (src === "BASIC_16" ? beneficiary?.lmpDate : "");
    return addDaysToDate(srcVal, question.computed.offsetDays);
  }
  return values[question.code] ?? "";
};

const buildInitialFormValues = (questions, prefill, beneficiary) => {
  const vals = {};
  (questions || []).forEach((q) => {
    const cur = prefill[q.code] ?? q.currentValue ?? q.defaultValue ?? "";
    vals[q.code] = q.answerType === "DATE" ? formatDateForInput(cur) : cur ?? "";
  });
  (questions || []).forEach((q) => {
    if (!q?.computed) return;
    const cv = resolveComputedValue(q, vals, beneficiary);
    vals[q.code] = q.answerType === "DATE" ? formatDateForInput(cv) : cv;
  });
  return vals;
};

// ─── Inline styles ────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #f0f4ff 0%, #e8f0fe 100%)",
  },
  frame: {
    maxWidth: "1100px",
    margin: "0 auto",
    paddingBottom: "32px",
  },
  hero: {
    borderRadius: "18px",
    padding: "18px 24px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
    color: "#fff",
    boxShadow: "0 10px 32px rgba(15,23,42,0.18)",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  heroPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 11px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.88)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    marginBottom: "6px",
  },
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginBottom: "16px",
  },
  metricCard: {
    borderRadius: "14px",
    padding: "10px 12px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.2)",
    boxShadow: "0 3px 10px rgba(15,23,42,0.06)",
  },
  metricLabel: {
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "2px",
    wordBreak: "break-word",
  },
  metricValue: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1,
  },
  metricSub: {
    fontSize: "10px",
    color: "#94a3b8",
    marginTop: "3px",
    wordBreak: "break-word",
  },
  panel: {
    borderRadius: "18px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 6px 20px rgba(15,23,42,0.07)",
    overflow: "hidden",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(148,163,184,0.14)",
    background: "#fafbff",
  },
  // Beneficiary row (always visible)
  benRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid rgba(148,163,184,0.12)",
    transition: "background 0.15s",
    gap: "8px",
    userSelect: "none",
    flexWrap: "wrap",
  },
  benAvatar: {
    flexShrink: 0,
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "14px",
  },
  // Expandable body wrapper
  benBody: {
    borderBottom: "1px solid rgba(148,163,184,0.12)",
    background: "#f8faff",
    overflow: "hidden",
  },
  // Section header inside expanded card
  sectionToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px 10px 20px",
    cursor: "pointer",
    borderBottom: "1px solid rgba(148,163,184,0.1)",
    background: "rgba(241,245,255,0.7)",
    fontSize: "12px",
    fontWeight: 700,
    color: "#3b4a6b",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    userSelect: "none",
  },
  // Info grid inside section
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px 20px",
    padding: "14px 20px",
  },
  infoLabel: {
    fontSize: "10px",
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "2px",
  },
  infoValue: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1e293b",
  },
  // Compact form list inside section
  formsGrid: {
    padding: "12px 20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(148,163,184,0.16)",
    background: "#fff",
    cursor: "pointer",
    transition: "box-shadow 0.15s",
    gap: "10px",
  },
  formShell: {
    borderRadius: "18px",
    background: "#fff",
    boxShadow: "0 8px 28px rgba(15,23,42,0.10)",
    border: "1px solid rgba(37,99,235,0.12)",
    overflow: "hidden",
  },
  formHeader: {
    padding: "18px 24px 16px",
    borderBottom: "1px solid rgba(148,163,184,0.14)",
    background: "#fafbff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
  },
  formBody: {
    padding: "20px 24px",
  },
  formFooter: {
    padding: "14px 24px",
    borderTop: "1px solid rgba(148,163,184,0.14)",
    background: "#fafbff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
  },
  emptyBox: {
    minHeight: "220px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #f8fbff, #eff6ff)",
    border: "1px dashed rgba(37,99,235,0.25)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "32px",
    margin: "20px",
  },
};

// ─── Chevron icon ─────────────────────────────────────────────────────────────
function Chevron({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        flexShrink: 0,
        transition: "transform 0.22s",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        color: "#94a3b8",
      }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressPill({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = pct === 100 ? "#16a34a" : pct > 50 ? "#2563eb" : "#f59e0b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
      <div style={{ width: "60px", height: "5px", borderRadius: "4px", background: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>
        {done}/{total}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EntryForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const toastTimerRef = useRef(null);

  const assignmentId =
    location.state?.assignmentId ?? location.state?.staff?.assignmentId ?? null;
  const staff = location.state?.staff ?? null;
  const facility = location.state?.facility ?? null;
  const masterContext = location.state?.masterContext ?? null;

  // Core data states
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Form states
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [selectedFormCode, setSelectedFormCode] = useState("BASIC");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState("");
  const [schema, setSchema] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [validationFocusCode, setValidationFocusCode] = useState(null);
  const fieldRefs = useRef({});

  // Collapse/expand state: ID of the currently open beneficiary accordion (only one at a time)
  const [openCardId, setOpenCardId] = useState(null);
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // ── Derived values ────────────────────────────────────────────────────────

  const facilityName = useMemo(
    () => facility?.name || masterContext?.facilities?.[0]?.facility?.name || "Facility",
    [facility, masterContext]
  );

  const displayName = useMemo(() => {
    if (staff?.healthWorker?.fullName) return staff.healthWorker.fullName;
    if (masterContext?.displayName) return masterContext.displayName;
    return localStorage.getItem("profileName") || "User";
  }, [staff, masterContext]);

  const beneficiaryTitle = useMemo(() => {
    if (!selectedBeneficiary) return "";
    return (
      selectedBeneficiary.fullName ||
      selectedBeneficiary.code ||
      `Beneficiary #${selectedBeneficiary.id}`
    );
  }, [selectedBeneficiary]);

  const dashboardStats = useMemo(() => {
    const beneficiaryCount = beneficiaries.length;
    const formCards = beneficiaries.reduce(
      (c, b) => c + (Array.isArray(b.formStatus) ? b.formStatus.length : 0),
      0
    );
    const submittedForms = beneficiaries.reduce(
      (c, b) =>
        c +
        (Array.isArray(b.formStatus)
          ? b.formStatus.filter((f) => f.exists || f.status === "SUBMITTED").length
          : 0),
      0
    );
    return { beneficiaryCount, formCards, submittedForms };
  }, [beneficiaries]);

  const filteredBeneficiaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return beneficiaries;
    return beneficiaries.filter((b) => {
      const name = (b.fullName || "").toLowerCase();
      const code = (b.code || "").toLowerCase();
      const mobile = (b.mobilePhone || "").toLowerCase();
      const village = (b.village || "").toLowerCase();
      return name.includes(q) || code.includes(q) || mobile.includes(q) || village.includes(q);
    });
  }, [beneficiaries, searchQuery]);

  const isUpdateMode = Boolean(selectedBeneficiary?.id);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getFormCode = (item) => item?.formCode || item?.code || "BASIC";

  const resolveAddTarget = () => {
    const fallbackId = location.state?.beneficiaryId ?? null;
    if (!fallbackId) return { id: null, fullName: "New Beneficiary", code: "NEW" };
    return {
      id: fallbackId,
      fullName: beneficiaries[0]?.fullName || "New Beneficiary",
      code: beneficiaries[0]?.code || `BEN-${fallbackId}`,
    };
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("");
  };

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  useEffect(() => {
    if (!validationFocusCode) return;
    const target = fieldRefs.current[validationFocusCode];
    if (target?.focus) target.focus({ preventScroll: true });
    if (target?.scrollIntoView) target.scrollIntoView({ behavior: "smooth", block: "center" });
    setValidationFocusCode(null);
  }, [validationFocusCode]);

  // ── Collapse/Expand helpers ───────────────────────────────────────────────

  // Only one card open at a time — click again to close
  const toggleCard = (id) => {
    setOpenCardId((prev) => (prev === id ? null : id));
  };

  // ── API calls ─────────────────────────────────────────────────────────────

  const fetchBeneficiaries = async (token) => {
    if (!assignmentId) return;
    const response = await axios.get(`/api/asha/${assignmentId}/beneficiaries`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    setBeneficiaries(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) { alert("Session expired. Please log in again."); navigate("/login"); return; }
    if (!assignmentId) { setListError("No ASHA assignment selected."); setListLoading(false); return; }

    const load = async () => {
      setListLoading(true);
      setListError("");
      try {
        await fetchBeneficiaries(token);
      } catch (err) {
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          navigate("/login");
          return;
        }
        setListError(err.response?.data?.message || "An error occurred while fetching beneficiaries.");
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, [assignmentId, navigate]);

  const openSchemaForm = async (beneficiary, formCode = "BASIC") => {
    const token = localStorage.getItem("authToken");
    if (!token) { alert("Session expired. Please log in again."); navigate("/login"); return; }
    setSchemaLoading(true);
    setSchemaError("");
    setSelectedFormCode(formCode);
    try {
      const query = beneficiary?.id ? `?beneficiaryId=${beneficiary.id}` : "";
      const response = await axios.get(`/api/forms/${formCode}/schema${query}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      setSchema(response.data);
      setSelectedBeneficiary(beneficiary);
      const prefill = response.data?.prefill || {};
      setFormValues(buildInitialFormValues(response.data?.questions || [], prefill, beneficiary));
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.clear();
        navigate("/login");
        return;
      }
      setSchemaError(err.response?.data?.message || "An error occurred while loading the form schema.");
    } finally {
      setSchemaLoading(false);
    }
  };

  const closeSchemaForm = () => {
    setSelectedBeneficiary(null);
    setSelectedFormCode("BASIC");
    setSchema(null);
    setFormValues({});
    setSchemaError("");
  };

  const handleInputChange = (questionCode, value, question) => {
    const sanitize = question.answerType === "NUMERIC" ? value.replace(/[^0-9]/g, "") : value;
    setFormValues((prev) => {
      const next = { ...prev, [questionCode]: sanitize };
      (schema?.questions || []).forEach((sq) => {
        if (sq?.computed?.kind === "DATE_OFFSET" && sq.computed.sourceQuestionCode === questionCode) {
          const cv = resolveComputedValue(sq, next, selectedBeneficiary);
          next[sq.code] = formatDateForInput(cv);
        }
      });
      return next;
    });
  };

  const handleAddBeneficiary = () => openSchemaForm(resolveAddTarget(), "BASIC");

  const handleSaveForm = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) { alert("Session expired. Please log in again."); navigate("/login"); return; }
    if (!schema) return;
    const isUpdate = Boolean(selectedBeneficiary?.id);
    if (selectedFormCode === "BASIC" && !assignmentId && !isUpdate) { alert("No ASHA assignment selected."); return; }
    if (!isUpdate && selectedFormCode !== "BASIC") { alert("No beneficiary selected for this form."); return; }

    const answers = {};
    (schema.questions || []).forEach((q) => {
      const raw = formValues[q.code] ?? "";
      if (q.answerType === "DATE") { answers[q.code] = formatDateForPayload(raw, selectedFormCode, isUpdate); return; }
      if (q.answerType === "NUMERIC") { answers[q.code] = raw === "" ? "" : Number(raw); return; }
      answers[q.code] = raw;
    });

    setSaveLoading(true);
    try {
      const payload = { answers, status: "SUBMITTED" };
      const cfg = { headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` } };
      if (selectedFormCode !== "BASIC") {
        await axios.post(`/api/beneficiaries/${selectedBeneficiary.id}/forms/${selectedFormCode}`, payload, cfg);
      } else if (isUpdate) {
        await axios.put(`/api/beneficiaries/${selectedBeneficiary.id}`, payload, cfg);
      } else {
        await axios.post(`/api/asha/${assignmentId}/beneficiaries`, payload, cfg);
      }
      await fetchBeneficiaries(token);
      showToast(isUpdate ? "Updated successfully." : "Saved successfully.", "success");
      closeSchemaForm();
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.clear();
        navigate("/login");
        return;
      }
      const friendly = parseValidationError(
        err.response?.data?.message || err.response?.data?.error || err.message || "An error occurred."
      );
      if (friendly.fieldCode) setValidationFocusCode(friendly.fieldCode);
      showToast(friendly.message, "error");
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Render: Dynamic form field ────────────────────────────────────────────

  const renderDynamicField = (question) => {
    const value = formValues[question.code] ?? "";
    const isReadOnly = Boolean(question.computed);
    const label = question.labelHi || question.labelEn || question.code;
    const sortedOptions = Array.isArray(question.options)
      ? [...question.options].sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      : [];

    return (
      <div className="col-lg-6 col-md-12 mb-3" key={question.code}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px", display: "block" }}>
          {label}
          {question.mandatory && <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
        </label>
        <div className="position-relative">
          {question.answerType === "TEXT" && (
            <input
              type="text"
              className="form-control form-control-sm"
              value={value}
              readOnly={isReadOnly}
              ref={(node) => { if (node) fieldRefs.current[question.code] = node; }}
              onChange={(e) => handleInputChange(question.code, e.target.value, question)}
              placeholder={label}
              style={{ borderRadius: "8px", fontSize: "13px" }}
            />
          )}
          {question.answerType === "NUMERIC" && (
            <input
              type="text"
              inputMode="numeric"
              className="form-control form-control-sm"
              value={value}
              readOnly={isReadOnly}
              ref={(node) => { if (node) fieldRefs.current[question.code] = node; }}
              onChange={(e) => handleInputChange(question.code, e.target.value, question)}
              placeholder={label}
              style={{ borderRadius: "8px", fontSize: "13px" }}
            />
          )}
          {question.answerType === "DATE" && (
            <input
              type="date"
              className="form-control form-control-sm"
              value={value}
              readOnly={isReadOnly}
              ref={(node) => { if (node) fieldRefs.current[question.code] = node; }}
              onChange={(e) => handleInputChange(question.code, e.target.value, question)}
              style={{ borderRadius: "8px", fontSize: "13px" }}
            />
          )}
          {question.answerType === "SINGLE_CHOICE" && (
            <select
              className="form-control form-control-sm"
              value={value}
              disabled={isReadOnly}
              ref={(node) => { if (node) fieldRefs.current[question.code] = node; }}
              onChange={(e) => handleInputChange(question.code, e.target.value, question)}
              style={{ borderRadius: "8px", fontSize: "13px" }}
            >
              <option value="">Select an option</option>
              {sortedOptions.map((opt) => (
                <option key={`${question.code}-${opt.value}`} value={opt.value}>
                  {opt.labelHi || opt.labelEn || opt.value}
                </option>
              ))}
            </select>
          )}
          {question.computed && (
            <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
              {question.remarks || "Auto-computed"}
            </small>
          )}
        </div>
      </div>
    );
  };

  // ── Render: Compact beneficiary accordion card ────────────────────────────

  const renderBeneficiaryCard = (beneficiary, idx) => {
    const cardId = beneficiary.id || `new-${idx}`;
    const isOpen = openCardId === cardId;
    const statusStyle = getStatusStyle(beneficiary.status || "ACTIVE");

    const formList = Array.isArray(beneficiary.formStatus)
      ? [...beneficiary.formStatus].sort((a, b) => (a.formSequence || 0) - (b.formSequence || 0))
      : [];
    const submittedCount = formList.filter((f) => f.exists || f.status === "SUBMITTED").length;

    return (
      <div key={cardId}>
        {/* ── Header row (always visible) ── */}
        <div
          role="button"
          tabIndex={0}
          style={{
            ...S.benRow,
            background: isOpen ? "#f0f5ff" : "#fff",
            borderBottom: isOpen
              ? "1px solid rgba(37,99,235,0.14)"
              : "1px solid rgba(148,163,184,0.12)",
          }}
          onClick={() => toggleCard(cardId)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCard(cardId); } }}
          onMouseEnter={(e) => { e.currentTarget.style.background = isOpen ? "#eaf0ff" : "#f8faff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = isOpen ? "#f0f5ff" : "#fff"; }}
        >
          {/* Avatar */}
          <div style={S.benAvatar}>{getInitials(beneficiary.fullName)}</div>

          {/* Name + code — takes remaining space */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {beneficiary.fullName || "Unnamed"}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {beneficiary.code || `#${beneficiary.id}`}
            </div>
          </div>

          {/* Right-side actions: wrap on mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* Status badge */}
            <span style={{ ...statusStyle, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px", whiteSpace: "nowrap" }}>
              {beneficiary.status || "ACTIVE"}
            </span>

            {/* Form progress */}
            {formList.length > 0 && (
              <ProgressPill done={submittedCount} total={formList.length} />
            )}

            {/* Edit quick-action */}
            <button
              type="button"
              className="btn btn-sm"
              style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "7px", background: "rgba(37,99,235,0.08)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.18)", whiteSpace: "nowrap" }}
              onClick={(e) => { e.stopPropagation(); openSchemaForm(beneficiary, "BASIC"); }}
              disabled={schemaLoading}
            >
              Edit
            </button>

            <Chevron open={isOpen} />
          </div>
        </div>

        {/* ── Expanded body: Basic Info + Forms together ── */}
        {isOpen && (
          <div style={{ ...S.benBody, borderBottom: "1px solid rgba(37,99,235,0.12)" }}>

            {/* Basic Info grid */}
            <div style={{ ...S.infoGrid, borderBottom: formList.length > 0 ? "1px solid rgba(148,163,184,0.12)" : "none", paddingBottom: "16px" }}>
              {[
                { label: "Husband / Father", value: beneficiary.husbandName },
                { label: "Mobile",           value: beneficiary.mobilePhone },
                { label: "Village",          value: beneficiary.village },
                { label: "Age",              value: beneficiary.age ? `${beneficiary.age} yrs` : null },
                { label: "LMP Date",         value: formatDate(beneficiary.lmpDate) },
                { label: "EDD Date",         value: formatDate(beneficiary.eddDate) },
                { label: "ABHA ID",          value: beneficiary.abhaId },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={S.infoLabel}>{label}</div>
                  <div style={S.infoValue}>{value || "—"}</div>
                </div>
              ))}
            </div>

            {/* Forms list */}
            {formList.length > 0 && (
              <div style={S.formsGrid}>
                {formList.map((form) => {
                  const submitted = Boolean(form.exists || form.status === "SUBMITTED");
                  const chipStyle = getStatusStyle(submitted ? "SUBMITTED" : "PENDING");
                  const fc = getFormCode(form);
                  return (
                    <div
                      key={fc}
                      role="button"
                      tabIndex={0}
                      style={S.formRow}
                      onClick={() => openSchemaForm(beneficiary, fc)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSchemaForm(beneficiary, fc); } }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.10)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#1e293b", lineHeight: 1.2 }}>
                          {form.formName}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                          {fc}{form.prerequisiteCode && ` · Prereq: ${form.prerequisiteCode}`}
                        </div>
                        {submitted && form.submittedAt && (
                          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                            {formatDate(form.submittedAt)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <span style={{ ...chipStyle, fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px" }}>
                          {submitted ? form.status || "SUBMITTED" : "PENDING"}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={(e) => { e.stopPropagation(); openSchemaForm(beneficiary, fc); }}
                          style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "7px" }}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <Base title="Beneficiaries">
      <div className="container-fluid page-body-wrapper" style={S.page}>
        <div className="main-panel">
          <div className="content-wrapper" style={{ background: "transparent" }}>
            <div style={S.frame}>

              {/* ── Hero ── */}
              <div style={S.hero}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.heroPill}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#22c55e", display: "inline-block" }} />
                    ASHA Beneficiary Workspace
                  </div>
                  <h2 style={{ fontWeight: 800, fontSize: "20px", margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</h2>
                  <p style={{ opacity: 0.82, fontSize: "12px", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {facilityName}{assignmentId ? ` · Assignment #${assignmentId}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ borderRadius: "12px", fontWeight: 700, fontSize: "13px", padding: "8px 18px", flexShrink: 0 }}
                  onClick={() => window.history.back()}
                >
                  ← Back to Staff
                </button>
              </div>

              {/* ── Stats ── (only when not in form view) */}
              {!selectedBeneficiary && (
                <div style={S.metricsRow}>
                  {[
                    { label: "Beneficiaries", value: dashboardStats.beneficiaryCount, sub: "In this assignment" },
                    { label: "Total Forms", value: dashboardStats.formCards, sub: "Available entries" },
                    { label: "Submitted", value: dashboardStats.submittedForms, sub: "Already completed" },
                  ].map(({ label, value, sub }) => (
                    <div key={label} style={S.metricCard}>
                      <div style={S.metricLabel}>{label}</div>
                      <div style={S.metricValue}>{value}</div>
                      <div style={S.metricSub}>{sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── LIST VIEW ── */}
              {!selectedBeneficiary && (
                <div style={S.panel}>
                  {/* Panel header */}
                  <div style={{ ...S.panelHeader, flexWrap: "wrap", gap: "8px" }}>
                    {/* Row 1: Title + count + Add button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                      <span style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>
                        Beneficiary List
                      </span>
                      {!listLoading && !listError && (
                        <span
                          style={{
                            background: searchQuery ? "rgba(37,99,235,0.12)" : "rgba(37,99,235,0.08)",
                            color: "#1d4ed8",
                            fontWeight: 700,
                            fontSize: "11px",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {searchQuery
                            ? `${filteredBeneficiaries.length} / ${beneficiaries.length}`
                            : `${beneficiaries.length} record${beneficiaries.length !== 1 ? "s" : ""}`}
                        </span>
                      )}
                      {/* Spacer pushes Add button to right */}
                      <div style={{ flex: 1 }} />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ borderRadius: "9px", fontWeight: 700, fontSize: "12px", padding: "6px 14px", flexShrink: 0, whiteSpace: "nowrap" }}
                        onClick={handleAddBeneficiary}
                        disabled={schemaLoading || listLoading}
                      >
                        + Add Beneficiary
                      </button>
                    </div>

                    {/* Row 2: Search box — full width on mobile */}
                    {!listLoading && !listError && beneficiaries.length > 0 && (
                      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
                        {/* Search icon */}
                        <svg
                          width="14" height="14" viewBox="0 0 16 16" fill="none"
                          style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}
                        >
                          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setOpenCardId(null); // collapse all on new search
                          }}
                          placeholder="Search by name, code, mobile, village..."
                          style={{
                            width: "100%",
                            padding: "7px 30px 7px 30px",
                            borderRadius: "9px",
                            border: "1px solid rgba(148,163,184,0.3)",
                            fontSize: "12px",
                            color: "#1e293b",
                            background: "#fff",
                            outline: "none",
                            boxShadow: searchQuery ? "0 0 0 2px rgba(37,99,235,0.18)" : "none",
                            transition: "box-shadow 0.15s",
                          }}
                          onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px rgba(37,99,235,0.22)"; e.target.style.borderColor = "rgba(37,99,235,0.4)"; }}
                          onBlur={(e) => { e.target.style.boxShadow = searchQuery ? "0 0 0 2px rgba(37,99,235,0.18)" : "none"; e.target.style.borderColor = "rgba(148,163,184,0.3)"; }}
                        />
                        {/* Clear button */}
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => { setSearchQuery(""); setOpenCardId(null); }}
                            style={{
                              position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                              background: "none", border: "none", cursor: "pointer", padding: "2px",
                              color: "#94a3b8", fontSize: "14px", lineHeight: 1, display: "flex", alignItems: "center",
                            }}
                            title="Clear search"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Panel body */}
                  {listLoading ? (
                    <div className="text-center py-5">
                      <img alt="loading" src="./images/loading.gif" style={{ height: "72px" }} />
                      <div className="mt-2 text-muted" style={{ fontSize: "13px" }}>Fetching beneficiaries...</div>
                    </div>
                  ) : listError ? (
                    <div className="alert alert-danger m-3 mb-3" role="alert" style={{ borderRadius: "10px" }}>
                      {listError}
                    </div>
                  ) : beneficiaries.length === 0 ? (
                    <div style={S.emptyBox}>
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "18px",
                          background: "rgba(37,99,235,0.1)",
                          color: "#2563eb",
                          fontSize: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "14px",
                        }}
                      >
                        +
                      </div>
                      <h5 style={{ fontWeight: 800, color: "#1e293b", marginBottom: "6px" }}>No beneficiaries yet</h5>
                      <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px", maxWidth: "340px" }}>
                        This assignment has no beneficiaries. Click "Add Beneficiary" to create the first record.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ borderRadius: "10px", fontWeight: 700 }}
                        onClick={handleAddBeneficiary}
                      >
                        + Add Beneficiary
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Column headers — hide on very small screens */}
                      <div
                        className="d-none d-sm-flex"
                        style={{
                          alignItems: "center",
                          padding: "8px 14px 8px 58px",
                          gap: "8px",
                          borderBottom: "1px solid rgba(148,163,184,0.12)",
                          background: "#f9fafb",
                        }}
                      >
                        <div style={{ flex: 1, fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Name</div>
                        <div style={{ width: "65px", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Status</div>
                        <div style={{ width: "80px", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Forms</div>
                        <div style={{ width: "50px" }} />
                        <div style={{ width: "16px" }} />
                      </div>
                      {filteredBeneficiaries.length > 0 ? (
                        filteredBeneficiaries.map((b, i) => renderBeneficiaryCard(b, i))
                      ) : (
                        <div style={{ padding: "32px 20px", textAlign: "center" }}>
                          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "14px", marginBottom: "4px" }}>
                            No results found
                          </div>
                          <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "12px" }}>
                            No beneficiary matches &ldquo;{searchQuery}&rdquo;
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}
                            onClick={() => setSearchQuery("")}
                          >
                            Clear search
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── FORM VIEW ── */}
              {selectedBeneficiary && (
                <div style={S.formShell}>
                  {/* Form header */}
                  <div style={S.formHeader}>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
                        {selectedFormCode} · Entry Form
                      </div>
                      <h4 style={{ fontWeight: 800, color: "#0f172a", margin: 0, fontSize: "18px" }}>
                        {beneficiaryTitle}
                      </h4>
                      <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0 0" }}>
                        {schema?.form?.name || "Loading form details..."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      style={{ borderRadius: "8px", fontWeight: 700 }}
                      onClick={closeSchemaForm}
                    >
                      ← Back to List
                    </button>
                  </div>

                  {/* Form body */}
                  <div style={S.formBody}>
                    {schemaLoading ? (
                      <div className="text-center py-5">
                        <img alt="loading" src="./images/loading.gif" style={{ height: "72px" }} />
                        <div className="mt-2 text-muted" style={{ fontSize: "13px" }}>Loading form schema...</div>
                      </div>
                    ) : schemaError ? (
                      <div className="alert alert-danger" role="alert" style={{ borderRadius: "10px" }}>{schemaError}</div>
                    ) : schema ? (
                      <>
                        {schema.form?.description && (
                          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(37,99,235,0.05)", marginBottom: "18px", border: "1px solid rgba(37,99,235,0.1)" }}>
                            <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e40af", marginBottom: "3px" }}>{schema.form.name}</div>
                            <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>{schema.form.description}</p>
                          </div>
                        )}
                        <div className="row">
                          {(schema.questions || [])
                            .slice()
                            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                            .map(renderDynamicField)}
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Form footer */}
                  {schema && !schemaLoading && (
                    <div style={S.formFooter}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        Beneficiary ID: {schema.beneficiaryId} &nbsp;·&nbsp; Form: {schema.form?.code || selectedFormCode}
                      </span>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          style={{ borderRadius: "8px", fontWeight: 700 }}
                          onClick={closeSchemaForm}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm px-4"
                          style={{ borderRadius: "8px", fontWeight: 700 }}
                          onClick={handleSaveForm}
                          disabled={saveLoading}
                        >
                          {saveLoading
                            ? isUpdateMode ? "Updating..." : "Saving..."
                            : isUpdateMode ? "Update" : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: 1055,
            minWidth: "260px",
            maxWidth: "360px",
            padding: "12px 16px 12px 18px",
            borderRadius: "14px",
            boxShadow: "0 12px 32px rgba(15,23,42,0.18)",
            color: toast.type === "error" ? "#7f1d1d" : "#0f172a",
            background: toast.type === "error"
              ? "linear-gradient(135deg, #fff1f2, #fee2e2)"
              : "linear-gradient(135deg, #eff6ff, #dbeafe)",
            border: toast.type === "error" ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(37,99,235,0.25)",
            borderLeft: toast.type === "error" ? "5px solid #ef4444" : "5px solid #2563eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, fontSize: "13px" }}>
              {toast.type === "error" ? "Error" : "Success"}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-link p-0 ml-2"
              onClick={() => setToast(null)}
              style={{ color: "inherit", textDecoration: "none", lineHeight: 1, fontSize: "16px" }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.9 }}>{toast.message}</div>
        </div>
      )}
    </Base>
  );
}
