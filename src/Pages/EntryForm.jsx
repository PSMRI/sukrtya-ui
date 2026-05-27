import React, { useEffect, useMemo, useState } from "react";
import Base from "../Components/Base";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const cardStyle = {
  border: "none",
  borderRadius: "18px",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

const headerStyle = {
  background:
    "linear-gradient(135deg, rgba(14, 165, 233, 0.96), rgba(59, 130, 246, 0.96))",
  color: "#fff",
  borderBottom: "none",
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
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.95))",
  border: "1px dashed rgba(37, 99, 235, 0.35)",
  boxShadow: "0 20px 55px rgba(37, 99, 235, 0.08)",
};

const formShellStyle = {
  borderRadius: "22px",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
  border: "1px solid rgba(37, 99, 235, 0.12)",
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

export default function EntryForm() {
  const navigate = useNavigate();
  const location = useLocation();

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

    const fetchBeneficiaries = async () => {
      setListLoading(true);
      setListError("");

      try {
        const response = await axios.get(
          `/api/asha/${assignmentId}/beneficiaries`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setBeneficiaries(Array.isArray(response.data) ? response.data : []);
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

    fetchBeneficiaries();
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
      const initialValues = {};

      (response.data?.questions || []).forEach((question) => {
        const currentValue =
          prefill[question.code] ?? question.currentValue ?? question.defaultValue ?? "";

        if (question.answerType === "DATE") {
          initialValues[question.code] = formatDateForInput(currentValue);
        } else {
          initialValues[question.code] = currentValue ?? "";
        }
      });

      setFormValues(initialValues);
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
      setFormValues((prev) => ({
        ...prev,
        [questionCode]: numericOnly,
      }));
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      [questionCode]: value,
    }));

    if (question.computed?.kind === "DATE_OFFSET" && question.code === "BASIC_16") {
      setFormValues((prev) => ({
        ...prev,
        BASIC_17: computeEdd(value),
      }));
    }
  };

  const handleAddBeneficiary = () => {
    openSchemaForm(resolveAddTarget(), "BASIC");
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
        <div className="d-flex flex-column gap-2">
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
                    borderRadius: "14px",
                    background: submitted
                      ? "rgba(37, 99, 235, 0.08)"
                      : "rgba(255, 255, 255, 0.8)",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div className="font-weight-bold text-dark">
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
                  <div className="text-right">
                    <span
                      className="badge"
                      style={{
                        ...chipStyle,
                        padding: "7px 12px",
                        borderRadius: "999px",
                        fontWeight: 700,
                      }}
                    >
                      {submitted ? form.status || "SUBMITTED" : "PENDING"}
                    </span>
                    <div className="text-muted mt-2" style={{ fontSize: "12px" }}>
                      {submitted
                        ? `Submitted ${formatDate(form.submittedAt)}`
                        : "Not submitted"}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSchemaForm(beneficiary, currentFormCode);
                      }}
                    >
                      Open
                    </button>
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

    return (
      <div className="col-xl-6 col-lg-6 col-md-12 mb-4" key={beneficiary.id}>
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
                  : "Add"}
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
              onChange={(e) => handleInputChange(question.code, e.target.value, question)}
            />
          )}

          {question.answerType === "SINGLE_CHOICE" && (
            <select
              className="form-control"
              value={value}
              disabled={isReadOnly}
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
      <div className="container-fluid page-body-wrapper">
        <div className="main-panel">
          <div className="content-wrapper">
            <div
              className="row mb-4"
              style={{
                borderRadius: "20px",
                padding: "24px",
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.92))",
                color: "#fff",
                boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
              }}
            >
              <div className="col-lg-8 col-md-12">
                <div
                  className="text-uppercase mb-2"
                  style={{ letterSpacing: "0.08em", fontSize: "11px" }}
                >
                  ASHA Beneficiaries
                </div>
                <h2 className="font-weight-bold mb-2">{displayName}</h2>
                <p className="mb-0" style={{ opacity: 0.9 }}>
                  {facilityName} {assignmentId ? `| Assignment #${assignmentId}` : ""}
                </p>
              </div>
              <div className="col-lg-4 col-md-12 text-lg-right mt-3 mt-lg-0">
                <button
                  type="button"
                  className="btn btn-light btn-lg px-4"
                  onClick={() => window.history.back()}
                >
                  Back to Staff
                </button>
              </div>
            </div>

            {!selectedBeneficiary ? (
              listLoading ? (
                <div className="text-center py-5">
                  <img
                    alt="loading"
                    src="./images/loading.gif"
                    style={{ height: "96px" }}
                  />
                  <div className="mt-3 text-muted">Fetching beneficiaries...</div>
                </div>
              ) : listError ? (
                <div className="alert alert-danger" role="alert">
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
                <div className="row">
                  <div className="col-12 mb-3">
                    <div className="d-flex align-items-center justify-content-between flex-wrap">
                      <div>
                        <h4 className="font-weight-bold mb-1">Beneficiary List</h4>
                        <p className="text-muted mb-0">
                          {beneficiaries.length} record(s) loaded
                        </p>
                      </div>
                    </div>
                  </div>
                  {beneficiaries.map(renderBeneficiaryCard)}
                </div>
              )
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
                        <button type="button" className="btn btn-primary px-4">
                          Save Draft
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

      <div className="floating-back-button" onClick={() => window.history.back()}>
        ← Back
      </div>
    </Base>
  );
}
