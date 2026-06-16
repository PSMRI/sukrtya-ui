import React, { useEffect, useState } from "react";
import Base from "../Components/Base";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../Context/ToastContext";

// ── Inline responsive styles ────────────────────────────────────────────────
const css = `
  .ft-page { background: linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 100%); min-height: 100vh; }
  .ft-frame { max-width: 1000px; margin: 0 auto; padding: 0 0 32px; }

  /* Hero */
  .ft-hero {
    background: linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#2563eb 100%);
    color: #fff;
    border-radius: 18px;
    padding: 18px 24px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    box-shadow: 0 10px 32px rgba(15,23,42,.18);
  }
  .ft-hero-left { flex: 1; min-width: 0; }
  .ft-hero h2 { font-size: 20px; font-weight: 800; margin: 0; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ft-hero p  { font-size: 12px; opacity: .82; margin: 3px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Two-column grid on md+, single column on mobile */
  .ft-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 767px) { .ft-grid { grid-template-columns: 1fr; } }

  /* Card shell */
  .ft-card { border-radius: 14px; background: #fff; border: 1px solid rgba(148,163,184,.18); box-shadow: 0 4px 16px rgba(15,23,42,.07); overflow: hidden; }
  .ft-card-header { padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
  .ft-card-header h5 { font-size: 14px; font-weight: 800; margin: 0; color: #fff; }
  .ft-card-header .count-pill {
    background: rgba(255,255,255,.22);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 9px;
    border-radius: 999px;
  }

  /* Staff list item */
  .ft-staff-item {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    gap: 10px;
    border-bottom: 1px solid rgba(148,163,184,.1);
    transition: background .15s;
  }
  .ft-staff-item:last-child { border-bottom: none; }
  .ft-staff-item:hover { background: #f8faff; }

  /* Avatar circle */
  .ft-avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    color: #fff;
  }

  /* Text block */
  .ft-info { flex: 1; min-width: 0; }
  .ft-info-name { font-size: 13px; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ft-info-sub  { font-size: 11px; color: #94a3b8; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Right meta */
  .ft-meta { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }

  /* Status badge */
  .ft-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
  .ft-badge-active   { background: #dcfce7; color: #15803d; }
  .ft-badge-inactive { background: #fee2e2; color: #b91c1c; }
  .ft-badge-role     { background: rgba(37,99,235,.1); color: #1d4ed8; }

  /* Select button */
  .ft-select-btn {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 7px;
    border: 1px solid rgba(37,99,235,.25);
    background: rgba(37,99,235,.07);
    color: #2563eb;
    cursor: pointer;
    transition: background .15s;
    white-space: nowrap;
  }
  .ft-select-btn:hover { background: rgba(37,99,235,.15); }

  /* Empty state */
  .ft-empty { padding: 28px 20px; text-align: center; color: #94a3b8; font-size: 13px; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
};

const avatarColors = [
  "linear-gradient(135deg,#1e3a8a,#2563eb)",
  "linear-gradient(135deg,#065f46,#059669)",
  "linear-gradient(135deg,#7c3aed,#a78bfa)",
  "linear-gradient(135deg,#b45309,#f59e0b)",
  "linear-gradient(135deg,#0f766e,#2dd4bf)",
];
const avatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

// ── Component ────────────────────────────────────────────────────────────────
export default function FacilityTrans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [ashaStaff, setAshaStaff] = useState([]);
  const [otherStaff, setOtherStaff] = useState([]);
  const [masterContext, setMasterContext] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      showToast("Session expired. Please log in again.", "error");
      navigate("/login");
      return;
    }

    const fetchMasterContext = async () => {
      try {
        const response = await axios.get("/api/me/master-context", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMasterContext(response.data);

        let ashaList = [];
        let otherList = [];
        if (response.data.facilities?.length > 0) {
          response.data.facilities.forEach((facility) => {
            (facility.staff || []).forEach((staff) => {
              if (staff.role === "ASHA") ashaList.push(staff);
              else otherList.push(staff);
            });
          });
        }
        setAshaStaff(ashaList);
        setOtherStaff(otherList);
        setLoading(false);
      } catch (error) {
        console.error("Error occurred:", error);
        if (error.response?.status === 401) {
          showToast("Session expired. Please log in again.", "error");
          localStorage.removeItem("authToken");
          navigate("/login");
        } else {
          setErrors({ global: error.response?.data?.message || "An error occurred while fetching data." });
        }
        setLoading(false);
      }
    };

    fetchMasterContext();
  }, [navigate]);

  const handleSelectAsha = (staff) => {
    navigate("/entry-form", {
      state: {
        assignmentId: staff.assignmentId,
        staff,
        facility: masterContext?.facilities?.[0]?.facility || null,
        masterContext,
      },
    });
  };

  return (
    <Base title="Staff Directory">
      {/* Inject scoped styles */}
      <style>{css}</style>

      <div className="container-fluid page-body-wrapper ft-page">
        <div className="main-panel">
          <div className="content-wrapper" style={{ background: "transparent" }}>
            <div className="ft-frame">

              {/* ── Hero ── */}
              <div className="ft-hero">
                <div className="ft-hero-left">
                  <h2>
                    {masterContext?.displayName
                      ? `Welcome, ${masterContext.displayName}`
                      : "Staff Directory"}
                  </h2>
                  <p>{masterContext?.facilities?.[0]?.facility?.name || "Facility"}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ borderRadius: "12px", fontWeight: 700, fontSize: "13px", padding: "8px 18px", flexShrink: 0 }}
                  onClick={() => window.history.back()}
                >
                  ← Back
                </button>
              </div>

              {/* ── Loading ── */}
              {loading ? (
                <div className="text-center" style={{ padding: "50px" }}>
                  <img alt="loading" src="./images/loading.gif" style={{ height: "80px" }} />
                  <p className="mt-3 text-muted" style={{ fontSize: "13px" }}>Loading staff information...</p>
                </div>
              ) : (
                <div className="ft-grid">

                  {/* ── ASHA Staff Card ── */}
                  <div className="ft-card">
                    <div className="ft-card-header" style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}>
                      <h5>ASHA Staff</h5>
                      <span className="count-pill">{ashaStaff.length}</span>
                    </div>
                    {ashaStaff.length > 0 ? (
                      ashaStaff.map((staff, idx) => {
                        const name = staff.healthWorker?.fullName || "N/A";
                        return (
                          <div className="ft-staff-item" key={idx}>
                            <div className="ft-avatar" style={{ background: avatarColor(name) }}>
                              {getInitials(name)}
                            </div>
                            <div className="ft-info">
                              <div className="ft-info-name">{name}</div>
                              <div className="ft-info-sub">
                                {staff.healthWorker?.mobilePhone || "No mobile"}
                              </div>
                            </div>
                            <div className="ft-meta">
                              <button
                                type="button"
                                className="ft-select-btn"
                                title={`Assignment: ${staff.assignmentId || "N/A"}`}
                                onClick={() => handleSelectAsha(staff)}
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="ft-empty">No ASHA staff found</div>
                    )}
                  </div>

                  {/* ── Other Staff Card ── */}
                  <div className="ft-card">
                    <div className="ft-card-header" style={{ background: "linear-gradient(135deg,#065f46,#059669)" }}>
                      <h5>Other Staff</h5>
                      <span className="count-pill">{otherStaff.length}</span>
                    </div>
                    {otherStaff.length > 0 ? (
                      otherStaff.map((staff, idx) => {
                        const name = staff.healthWorker?.fullName || "N/A";
                        const isActive = staff.status === "ACTIVE";
                        return (
                          <div className="ft-staff-item" key={idx}>
                            <div className="ft-avatar" style={{ background: avatarColor(name) }}>
                              {getInitials(name)}
                            </div>
                            <div className="ft-info">
                              <div className="ft-info-name">{name}</div>
                              <div className="ft-info-sub">
                                {staff.healthWorker?.mobilePhone || "No mobile"}
                              </div>
                            </div>
                            <div className="ft-meta">
                              <span className="ft-badge ft-badge-role">{staff.role}</span>
                              <span className={`ft-badge ${isActive ? "ft-badge-active" : "ft-badge-inactive"}`}>
                                {staff.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="ft-empty">No other staff found</div>
                    )}
                  </div>

                </div>
              )}

              {/* ── Error ── */}
              {errors.global && (
                <div className="alert alert-danger mt-3" role="alert" style={{ borderRadius: "10px" }}>
                  {errors.global}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </Base>
  );
}
