import React, { useEffect, useMemo, useRef, useState } from "react";
import Base from "../Components/Base";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const cardStyle = {
  border: "none",
  borderRadius: "24px",
  boxShadow: "0 22px 50px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
  background: "#fff",
};

const headerStyle = {
  background:
    "linear-gradient(135deg, rgba(14, 165, 233, 0.96), rgba(59, 130, 246, 0.96))",
  color: "#fff",
  borderBottom: "none",
};

const pageBackdropStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 30%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
};

const pageFrameStyle = {
  maxWidth: "1480px",
  margin: "0 auto",
  paddingBottom: "24px",
};

const heroStyle = {
  borderRadius: "26px",
  padding: "28px 28px 26px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,64,175,0.94) 55%, rgba(37,99,235,0.92))",
  color: "#fff",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const heroMetaPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.92)",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.03em",
};

const metricCardStyle = {
  borderRadius: "20px",
  padding: "16px 18px",
  background: "rgba(255,255,255,0.86)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
};

const metricLabelStyle = {
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#64748b",
  fontWeight: 700,
};

const metricValueStyle = {
  fontSize: "26px",
  lineHeight: 1.1,
  color: "#0f172a",
  fontWeight: 800,
};

const sectionCardStyle = {
  borderRadius: "24px",
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  backdropFilter: "blur(12px)",
};

const statusPalette = {
  ACTIVE: { background: "#16a34a", color: "#fff" },
  INACTIVE: { background: "#6b7280", color: "#fff" },
  PENDING: { background: "#f59e0b", color: "#111827" },
  SUBMITTED: { background: "#2563eb", color: "#fff" },
  COMPLETED: { background: "#0f766e", color: "#fff" },
};

const emptyStyle = {
  minHeight: "320px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.95))",
  border: "1px dashed rgba(37, 99, 235, 0.28)",
  boxShadow: "0 20px 55px rgba(37, 99, 235, 0.08)",
};

const formShellStyle = {
  borderRadius: "24px",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.10)",
  border: "1px solid rgba(37, 99, 235, 0.10)",
};

const formatDate = (value) => {
  if (!value) return "N/A";
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
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const isoMatch = typeof value === "string" && value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateForPayload = (value, formCode, isUpdateMode) => {
  if (!value) return "";

  if (formCode === "BASIC") {
    if (isUpdateMode) {
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toISOString().slice(0, 10);
    }

    if (typeof value === "string" && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
      return value;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
};

const getStatusStyle = (status) =>
  statusPalette[status] || {
    background: "#e5e7eb",
    color: "#111827",
  };

const computeEdd = (lmpValue) => {
  if (!lmpValue) return "";
  const date = new Date(lmpValue);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + 280);
  return date.toISOString().slice(0, 10);
};

const addDaysToDate = (value, offsetDays) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + Number(offsetDays || 0));
  return date.toISOString().slice(0, 10);
};

const parseValidationError = (message) => {
  if (!message || typeof message !== "string") {
    return { message: "Please check the highlighted fields.", fieldCode: null };
  }

  const validationMatch = message.match(/Validation failed:\s*\[(.*)\]\s*$/i);
  if (!validationMatch) {
    return { message, fieldCode: null };
  }

  const rawItems = validationMatch[1]
    .split(/,\s*(?=[A-Z0-9_]+\s*\()/)
    .map((item) => item.trim())
    .filter(Boolean);

  const parsedItems = rawItems
    .map((item) => {
      const itemMatch = item.match(/^([A-Z0-9_]+)\s*\((.*?)\):\s*(.*)$/);
      if (!itemMatch) return null;

      return {
        code: itemMatch[1],
        label: itemMatch[2].trim(),
        reason: itemMatch[3].trim().replace(/\.$/, ""),
      };
    })
    .filter(Boolean);

  if (parsedItems.length === 0) {
    return { message: "Please check the highlighted fields.", fieldCode: null };
  }

  const labels = parsedItems.map((item) => item.label);
  const firstLabel = labels[0];
  const fieldCode = parsedItems[0].code;

  return {
    fieldCode,
    message:
      parsedItems.length === 1
        ? `${firstLabel} is required.`
        : `Please fill these required fields: ${labels.join(", ")}.`,
  };
};

const resolveComputedValue = (question, values, beneficiary) => {
  if (!question?.computed) return values[question.code] ?? "";

  if (question.computed.kind === "DATE_OFFSET") {
    const sourceQuestionCode = question.computed.sourceQuestionCode;
    const sourceValue =
      values[sourceQuestionCode] ??
      (sourceQuestionCode === "BASIC_16" ? beneficiary?.lmpDate : "");

    return addDaysToDate(sourceValue, question.computed.offsetDays);
  }

  return values[question.code] ?? "";
};

const buildInitialFormValues = (questions, prefill, beneficiary) => {
  const initialValues = {};

  (questions || []).forEach((question) => {
    const currentValue =
      prefill[question.code] ?? question.currentValue ?? question.defaultValue ?? "";

    if (question.answerType === "DATE") {
      initialValues[question.code] = formatDateForInput(currentValue);
      return;
    }

    initialValues[question.code] = currentValue ?? "";
  });

  (questions || []).forEach((question) => {
    if (!question?.computed) return;

    const computedValue = resolveComputedValue(question, initialValues, beneficiary);

    if (question.answerType === "DATE") {
      initialValues[question.code] = formatDateForInput(computedValue);
    } else {
      initialValues[question.code] = computedValue;
    }
  });

  return initialValues;
};

export default function EntryForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const toastTimerRef = useRef(null);

  const assignmentId =
    location.state?.assignmentId ??
    location.state?.staff?.assignmentId ??
    null;
  const staff = location.state?.staff ?? null;
  const facility = location.state?.facility ?? null;
  const masterContext = location.state?.masterContext ?? null;

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
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

  const facilityName = useMemo(
    () =>
      facility?.name ||
      masterContext?.facilities?.[0]?.facility?.name ||
      "Facility",
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
      (count, beneficiary) => count + (Array.isArray(beneficiary.formStatus) ? beneficiary.formStatus.length : 0),
      0
    );
    const submittedForms = beneficiaries.reduce(
      (count, beneficiary) =>
        count +
        (Array.isArray(beneficiary.formStatus)
          ? beneficiary.formStatus.filter(
              (form) => form.exists || form.status === "SUBMITTED"
            ).length
          : 0),
      0
    );

    return {
      beneficiaryCount,
      formCards,
      submittedForms,
    };
  }, [beneficiaries]);

  const isUpdateMode = Boolean(selectedBeneficiary?.id);

  const resolveAddTarget = () => {
    const fallbackId = location.state?.beneficiaryId ?? null;
    if (!fallbackId) {
      return {
        id: null,
        fullName: "New Beneficiary",
        code: "NEW",
      };
    }

    return {
      id: fallbackId,
      fullName: beneficiaries[0]?.fullName || "New Beneficiary",
      code: beneficiaries[0]?.code || `BEN-${fallbackId}`,
    };
  };

  const getFormCode = (item) => item?.formCode || item?.code || "BASIC";

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!validationFocusCode) return;

    const target = fieldRefs.current[validationFocusCode];
    if (target?.focus) {
      target.focus({ preventScroll: true });
    }
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    setValidationFocusCode(null);
  }, [validationFocusCode]);

  const fetchBeneficiaries = async (token) => {
    if (!assignmentId) {
      return;
    }

    const response = await axios.get(`/api/asha/${assignmentId}/beneficiaries`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    setBeneficiaries(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    if (!assignmentId) {
      setListError("No ASHA assignment selected.");
      setListLoading(false);
      return;
    }

    const loadBeneficiaries = async () => {
      setListLoading(true);
      setListError("");

      try {
        await fetchBeneficiaries(token);
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          navigate("/login");
          return;
        }

        setListError(
          requestError.response?.data?.message ||
            "An error occurred while fetching beneficiaries."
        );
      } finally {
        setListLoading(false);
      }
    };

    loadBeneficiaries();
  }, [assignmentId, navigate]);

  const openSchemaForm = async (beneficiary, formCode = "BASIC") => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    setSchemaLoading(true);
    setSchemaError("");
    setSelectedFormCode(formCode);

    try {
      const query = beneficiary?.id ? `?beneficiaryId=${beneficiary.id}` : "";
      const response = await axios.get(`/api/forms/${formCode}/schema${query}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setSchema(response.data);
      setSelectedBeneficiary(beneficiary);

      const prefill = response.data?.prefill || {};
      setFormValues(
        buildInitialFormValues(response.data?.questions || [], prefill, beneficiary)
      );
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      setSchemaError(
        requestError.response?.data?.message ||
          "An error occurred while loading the form schema."
      );
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
    if (question.answerType === "NUMERIC") {
      const numericOnly = value.replace(/[^0-9]/g, "");
      setFormValues((prev) => {
        const nextValues = {
          ...prev,
          [questionCode]: numericOnly,
        };

        (schema?.questions || []).forEach((schemaQuestion) => {
          if (
            schemaQuestion?.computed?.kind === "DATE_OFFSET" &&
            schemaQuestion.computed.sourceQuestionCode === questionCode
          ) {
            const computedValue = resolveComputedValue(
              schemaQuestion,
              nextValues,
              selectedBeneficiary
            );

            nextValues[schemaQuestion.code] = formatDateForInput(computedValue);
          }
        });

        return nextValues;
      });
      return;
    }

    setFormValues((prev) => {
      const nextValues = {
        ...prev,
        [questionCode]: value,
      };

      (schema?.questions || []).forEach((schemaQuestion) => {
        if (
          schemaQuestion?.computed?.kind === "DATE_OFFSET" &&
          schemaQuestion.computed.sourceQuestionCode === questionCode
        ) {
          const computedValue = resolveComputedValue(
            schemaQuestion,
            nextValues,
            selectedBeneficiary
          );

          nextValues[schemaQuestion.code] = formatDateForInput(computedValue);
        }
      });

      return nextValues;
    });
  };

  const handleAddBeneficiary = () => {
    openSchemaForm(resolveAddTarget(), "BASIC");
  };

  const handleSaveForm = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    if (!schema) {
      return;
    }

    const isUpdateMode = Boolean(selectedBeneficiary?.id);

    if (selectedFormCode === "BASIC" && !assignmentId && !isUpdateMode) {
      alert("No ASHA assignment selected.");
      return;
    }

    if (!isUpdateMode && selectedFormCode !== "BASIC") {
      alert("No beneficiary selected for this form.");
      return;
    }

    const answers = {};

    (schema.questions || []).forEach((question) => {
      const rawValue = formValues[question.code] ?? "";

      if (question.answerType === "DATE") {
        answers[question.code] = formatDateForPayload(
          rawValue,
          selectedFormCode,
          isUpdateMode
        );
        return;
      }

      if (question.answerType === "NUMERIC") {
        answers[question.code] = rawValue === "" ? "" : Number(rawValue);
        return;
      }

      answers[question.code] = rawValue;
    });

    setSaveLoading(true);

    try {
      const payload = {
        answers,
        status: "SUBMITTED",
      };

      const requestConfig = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (selectedFormCode !== "BASIC") {
        await axios.post(
          `/api/beneficiaries/${selectedBeneficiary.id}/forms/${selectedFormCode}`,
          payload,
          requestConfig
        );
      } else if (isUpdateMode) {
        await axios.put(`/api/beneficiaries/${selectedBeneficiary.id}`, payload, requestConfig);
      } else if (selectedFormCode === "BASIC") {
        await axios.post(`/api/asha/${assignmentId}/beneficiaries`, payload, requestConfig);
      } else {
        throw new Error("Unsupported form save flow.");
      }

      await fetchBeneficiaries(token);
      showToast(isUpdateMode ? "Updated successfully." : "Saved successfully.", "success");
      closeSchemaForm();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      const friendlyError = parseValidationError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          requestError.message ||
          "An error occurred while saving the form."
      );

      if (friendlyError.fieldCode) {
        setValidationFocusCode(friendlyError.fieldCode);
      }

      showToast(friendlyError.message, "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const renderFormStatus = (beneficiary) => {
    if (
      !Array.isArray(beneficiary.formStatus) ||
      beneficiary.formStatus.length === 0
    ) {
      return null;
    }

    return (
      <div className="mt-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <small className="text-uppercase text-muted font-weight-bold">
            Form progress
          </small>
          <small className="text-muted">
            {beneficiary.formStatus.length} forms
          </small>
        </div>
        <div className="d-flex flex-column" style={{ gap: "10px" }}>
          {beneficiary.formStatus
            .slice()
            .sort((a, b) => (a.formSequence || 0) - (b.formSequence || 0))
            .map((form) => {
              const submitted = Boolean(
                form.exists || form.status === "SUBMITTED"
              );
              const chipStyle = getStatusStyle(
                submitted ? "SUBMITTED" : "PENDING"
              );

              const currentFormCode = getFormCode(form);

              return (
                <div
                  key={currentFormCode}
                  role="button"
                  tabIndex={0}
                  onClick={() => openSchemaForm(beneficiary, currentFormCode)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openSchemaForm(beneficiary, currentFormCode);
                    }
                  }}
                  className="d-flex align-items-start justify-content-between p-3"
                  style={{
                    borderRadius: "16px",
                    background: submitted
                      ? "rgba(37, 99, 235, 0.08)"
                      : "rgba(255, 255, 255, 0.88)",
                    border: "1px solid rgba(148, 163, 184, 0.16)",
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
                    minHeight: "104px",
                    gap: "14px",
                  }}
                >
                  <div style={{ paddingRight: "8px" }}>
                    <div className="font-weight-bold text-dark" style={{ fontSize: "16px", lineHeight: 1.25 }}>
                      {form.formName}
                    </div>
                    <div className="text-muted" style={{ fontSize: "12px" }}>
                      Code: {currentFormCode}
                    </div>
                    {form.prerequisiteCode && (
                      <div className="text-muted" style={{ fontSize: "12px" }}>
                        Prerequisite: {form.prerequisiteCode}
                      </div>
                    )}
                  </div>
                  <div className="text-right" style={{ minWidth: "148px" }}>
                    <div className="d-flex align-items-center justify-content-end flex-nowrap" style={{ gap: "8px" }}>
                      <span
                        className="badge"
                        style={{
                          ...chipStyle,
                          padding: "7px 12px",
                          borderRadius: "999px",
                          fontWeight: 700,
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {submitted ? form.status || "SUBMITTED" : "PENDING"}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSchemaForm(beneficiary, currentFormCode);
                        }}
                        style={{ minWidth: "78px", padding: "6px 12px" }}
                      >
                        Open
                      </button>
                    </div>
                    <div className="text-muted mt-2" style={{ fontSize: "12px" }}>
                      {submitted
                        ? `Submitted ${formatDate(form.submittedAt)}`
                        : "Not submitted"}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const renderBeneficiaryCard = (beneficiary) => {
    const activeStyle = getStatusStyle(beneficiary.status || "ACTIVE");
    const ageLabel = beneficiary.age
      ? `${beneficiary.age} yrs`
      : "Age not available";
    const singleCardLayout = beneficiaries.length === 1;

    return (
      <div
        className={
          singleCardLayout
            ? "col-12 col-lg-10 col-xl-8 offset-lg-1 offset-xl-2 mb-4"
            : "col-xl-6 col-lg-6 col-md-12 mb-4"
        }
        key={beneficiary.id}
      >
        <div className="card h-100" style={cardStyle}>
          <div
            className="p-4"
            style={{
              ...headerStyle,
              background: "linear-gradient(135deg, #111827, #1d4ed8)",
            }}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div>
                <div
                  className="text-uppercase"
                  style={{ letterSpacing: "0.08em", fontSize: "11px" }}
                >
                  Beneficiary Profile
                </div>
                <h4 className="mb-1 font-weight-bold">
                  {beneficiary.fullName || "Unnamed beneficiary"}
                </h4>
                <div style={{ opacity: 0.9 }}>
                  {beneficiary.code || `ID #${beneficiary.id}`}
                </div>
              </div>
              <span
                className="badge"
                style={{
                  ...activeStyle,
                  padding: "8px 12px",
                  borderRadius: "999px",
                  fontWeight: 700,
                }}
              >
                {beneficiary.status || "ACTIVE"}
              </span>
            </div>

            <div className="mt-3 d-flex flex-wrap" style={{ gap: "10px" }}>
              <button
                type="button"
                className="btn btn-light btn-sm px-3"
                onClick={() => openSchemaForm(beneficiary, "BASIC")}
                disabled={schemaLoading}
              >
                {schemaLoading && selectedBeneficiary?.id === beneficiary.id
                  ? "Loading..."
                  : "Edit Basic Info"}
              </button>
            </div>
          </div>

          <div className="card-body p-4">
            <div className="row">
              <div className="col-6 mb-3">
                <div className="text-muted small">Husband Name</div>
                <div className="font-weight-bold">
                  {beneficiary.husbandName || "N/A"}
                </div>
              </div>
              <div className="col-6 mb-3">
                <div className="text-muted small">Mobile</div>
                <div className="font-weight-bold">
                  {beneficiary.mobilePhone || "N/A"}
                </div>
              </div>
              <div className="col-6 mb-3">
                <div className="text-muted small">Village</div>
                <div className="font-weight-bold">
                  {beneficiary.village || "N/A"}
                </div>
              </div>
              <div className="col-6 mb-3">
                <div className="text-muted small">Age</div>
                <div className="font-weight-bold">{ageLabel}</div>
              </div>
              <div className="col-6 mb-3">
                <div className="text-muted small">LMP Date</div>
                <div className="font-weight-bold">
                  {formatDate(beneficiary.lmpDate)}
                </div>
              </div>
              <div className="col-6 mb-3">
                <div className="text-muted small">EDD Date</div>
                <div className="font-weight-bold">
                  {formatDate(beneficiary.eddDate)}
                </div>
              </div>
              <div className="col-12">
                <div className="text-muted small">ABHA ID</div>
                <div className="font-weight-bold">
                  {beneficiary.abhaId || "N/A"}
                </div>
              </div>
            </div>

            {renderFormStatus(beneficiary)}
          </div>
        </div>
      </div>
    );
  };

  const renderDynamicField = (question) => {
    const value = formValues[question.code] ?? "";
    const isReadOnly = Boolean(question.computed);
    const label = question.labelHi || question.labelEn || question.code;
    const sortedOptions = Array.isArray(question.options)
      ? [...question.options].sort(
          (a, b) => (a.sequence || 0) - (b.sequence || 0)
        )
      : [];

    return (
      <div className="col-lg-6 col-md-12 mb-4" key={question.code}>
        <label className="font-weight-bold mb-2">
          {label}
          {question.mandatory && (
            <span style={{ color: "red", marginLeft: "5px" }}>*</span>
          )}
        </label>
        <div className="position-relative">
          {question.answerType === "TEXT" && (
            <input
              type="text"
              className="form-control"
              value={value}
              readOnly={isReadOnly}
              ref={(node) => {
                if (node) fieldRefs.current[question.code] = node;
              }}
              onChange={(e) => handleInputChange(question.code, e.target.value, question)}
              placeholder={label}
            />
          )}

          {question.answerType === "NUMERIC" && (
            <input
              type="text"
              inputMode="numeric"
              className="form-control"
              value={value}
              readOnly={isReadOnly}
              ref={(node) => {
                if (node) fieldRefs.current[question.code] = node;
              }}
              onChange={(e) => handleInputChange(question.code, e.target.value, question)}
              placeholder={label}
            />
          )}

          {question.answerType === "DATE" && (
            <input
              type="date"
              className="form-control"
              value={value}
              readOnly={isReadOnly}
              ref={(node) => {
                if (node) fieldRefs.current[question.code] = node;
              }}
              onChange={(e) => handleInputChange(question.code, e.target.value, question)}
            />
          )}

          {question.answerType === "SINGLE_CHOICE" && (
            <select
              className="form-control"
              value={value}
              disabled={isReadOnly}
              ref={(node) => {
                if (node) fieldRefs.current[question.code] = node;
              }}
              onChange={(e) =>
                handleInputChange(question.code, e.target.value, question)
              }
            >
              <option value="">Select an option</option>
              {sortedOptions.map((option) => (
                <option key={`${question.code}-${option.value}`} value={option.value}>
                  {option.labelHi || option.labelEn || option.value}
                </option>
              ))}
            </select>
          )}

          {question.computed && (
            <small className="text-muted d-block mt-2">
              {question.remarks || "Computed field"}
            </small>
          )}
        </div>
      </div>
    );
  };

  return (
    <Base title="Beneficiaries">
      <div className="container-fluid page-body-wrapper" style={pageBackdropStyle}>
        <div className="main-panel">
          <div className="content-wrapper" style={{ background: "transparent" }}>
            <div style={pageFrameStyle}>
              <div className="row mb-4" style={heroStyle}>
                <div className="col-xl-8 col-lg-8 col-md-12">
                  <div className="mb-3" style={heroMetaPillStyle}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#22c55e", display: "inline-block" }} />
                    ASHA Beneficiary Workspace
                  </div>
                  <h2 className="font-weight-bold mb-2" style={{ fontSize: "34px", lineHeight: 1.1 }}>
                    {displayName}
                  </h2>
                  <p className="mb-0" style={{ opacity: 0.88, fontSize: "15px" }}>
                    {facilityName} {assignmentId ? `| Assignment #${assignmentId}` : ""}
                  </p>
                </div>
                <div className="col-xl-4 col-lg-4 col-md-12 text-lg-right mt-4 mt-lg-0 d-flex justify-content-lg-end">
                  <button
                    type="button"
                    className="btn btn-light btn-lg px-4"
                    style={{ borderRadius: "14px", boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)" }}
                    onClick={() => window.history.back()}
                  >
                    Back to Staff
                  </button>
                </div>
              </div>

              {!selectedBeneficiary ? (
                <div className="row mb-4">
                  <div className="col-lg-4 col-md-12 mb-3 mb-lg-0">
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Beneficiaries</div>
                      <div style={metricValueStyle}>{dashboardStats.beneficiaryCount}</div>
                      <div className="text-muted mt-1" style={{ fontSize: "13px" }}>
                        Active records in this assignment
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-12 mb-3 mb-lg-0">
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Forms</div>
                      <div style={metricValueStyle}>{dashboardStats.formCards}</div>
                      <div className="text-muted mt-1" style={{ fontSize: "13px" }}>
                        Total form entries available
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-12">
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Submitted</div>
                      <div style={metricValueStyle}>{dashboardStats.submittedForms}</div>
                      <div className="text-muted mt-1" style={{ fontSize: "13px" }}>
                        Forms already completed
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {!selectedBeneficiary ? (
                <div style={sectionCardStyle} className="p-4 p-lg-5">
                  {listLoading ? (
                    <div className="text-center py-5">
                      <img
                        alt="loading"
                        src="./images/loading.gif"
                        style={{ height: "96px" }}
                      />
                      <div className="mt-3 text-muted">Fetching beneficiaries...</div>
                    </div>
                  ) : listError ? (
                    <div className="alert alert-danger mb-0" role="alert">
                      {listError}
                    </div>
                  ) : beneficiaries.length === 0 ? (
                    <div className="row justify-content-center">
                      <div className="col-lg-8 col-md-12">
                        <div className="card" style={emptyStyle}>
                          <div className="card-body d-flex flex-column align-items-center justify-content-center text-center p-5">
                            <div
                              className="mb-4 d-flex align-items-center justify-content-center"
                              style={{
                                width: "84px",
                                height: "84px",
                                borderRadius: "24px",
                                background: "rgba(37, 99, 235, 0.1)",
                                color: "#2563eb",
                                fontSize: "34px",
                              }}
                            >
                              +
                            </div>
                            <h3 className="font-weight-bold mb-2">
                              No beneficiaries found
                            </h3>
                            <p className="text-muted mb-4" style={{ maxWidth: "520px" }}>
                              This ASHA assignment does not have any beneficiaries yet.
                              Use the Add button to start creating the first record.
                            </p>
                            <button
                              type="button"
                              className="btn btn-primary btn-lg px-5"
                              onClick={handleAddBeneficiary}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="d-flex align-items-center justify-content-between flex-wrap mb-4">
                        <div>
                          <h4 className="font-weight-bold mb-1">Beneficiary List</h4>
                          
                        </div>
                        <div
                          className="badge badge-light"
                          style={{
                            padding: "10px 14px",
                            borderRadius: "999px",
                            background: "rgba(37, 99, 235, 0.08)",
                            color: "#1d4ed8",
                            fontWeight: 700,
                          }}
                        >
                          {beneficiaries.length} record(s) loaded
                        </div>
                      </div>
                      <div className="row">{beneficiaries.map(renderBeneficiaryCard)}</div>
                    </>
                  )}
                </div>
              ) : (
              <div style={formShellStyle} className="p-4 p-lg-5">
                <div className="d-flex align-items-start justify-content-between flex-wrap mb-4">
                  <div>
                    <div className="text-uppercase text-muted mb-1" style={{ letterSpacing: "0.08em", fontSize: "11px" }}>
                      {selectedFormCode} Entry Form
                    </div>
                    <h3 className="font-weight-bold mb-1">{beneficiaryTitle}</h3>
                    <p className="text-muted mb-0">
                      {schema?.form?.name || "Loading form details..."}
                    </p>
                  </div>
                  <button type="button" className="btn btn-outline-secondary" onClick={closeSchemaForm}>
                    Back to List
                  </button>
                </div>

                {schemaLoading ? (
                  <div className="text-center py-5">
                    <img
                      alt="loading"
                      src="./images/loading.gif"
                      style={{ height: "88px" }}
                    />
                    <div className="mt-3 text-muted">Loading form schema...</div>
                  </div>
                ) : schemaError ? (
                  <div className="alert alert-danger" role="alert">
                    {schemaError}
                  </div>
                ) : schema ? (
                  <>
                    <div className="mb-4 p-4" style={{ borderRadius: "18px", background: "rgba(37, 99, 235, 0.06)" }}>
                      <h4 className="font-weight-bold mb-2">{schema.form?.name}</h4>
                      <p className="text-muted mb-0">{schema.form?.description}</p>
                    </div>

                    <div className="row">
                      {(schema.questions || [])
                        .slice()
                        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                        .map(renderDynamicField)}
                    </div>

                    <div className="d-flex align-items-center justify-content-between flex-wrap mt-4 pt-3" style={{ borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
                      <div className="text-muted mb-3 mb-md-0">
                        Beneficiary ID: {schema.beneficiaryId} | Form Code: {schema.form?.code || selectedFormCode}
                      </div>
                      <div className="d-flex" style={{ gap: "12px" }}>
                        <button type="button" className="btn btn-outline-secondary" onClick={closeSchemaForm}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary px-4"
                          onClick={handleSaveForm}
                          disabled={saveLoading}
                        >
                          {saveLoading
                            ? isUpdateMode
                              ? "Updating..."
                              : "Saving..."
                            : isUpdateMode
                            ? "Update"
                            : "Save"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: 1055,
            minWidth: "280px",
            maxWidth: "380px",
            padding: "14px 16px 14px 18px",
            borderRadius: "16px",
            boxShadow: "0 18px 38px rgba(15, 23, 42, 0.2)",
            color: toast.type === "error" ? "#7f1d1d" : "#0f172a",
            background:
              toast.type === "error"
                ? "linear-gradient(135deg, #fff1f2, #fee2e2)"
                : "linear-gradient(135deg, #eff6ff, #dbeafe)",
            border:
              toast.type === "error"
                ? "1px solid rgba(248, 113, 113, 0.32)"
                : "1px solid rgba(37, 99, 235, 0.28)",
            borderLeft:
              toast.type === "error"
                ? "6px solid #ef4444"
                : "6px solid #2563eb",
          }}
          role="status"
          aria-live="polite"
        >
          <div className="d-flex align-items-start justify-content-between">
            <div style={{ fontWeight: 800, letterSpacing: "0.01em" }}>
              {toast.type === "error" ? "Error" : "Success"}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link p-0 ml-2"
              onClick={() => setToast(null)}
              style={{ color: "inherit", textDecoration: "none", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <div className="mt-1" style={{ fontSize: "14px", opacity: 0.92 }}>
            {toast.message}
          </div>
        </div>
      )}

    </Base>
  );
}
