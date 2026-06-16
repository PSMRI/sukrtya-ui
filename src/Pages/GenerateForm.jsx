import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../Context/ToastContext";
import Base from "../Components/Base";
import axios from "axios";

const css = `
  .gf-page { background: linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 100%); min-height: 100vh; }
  .gf-frame { max-width: 1100px; margin: 0 auto; padding: 0 0 40px; }

  /* Hero */
  .gf-hero {
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
  .gf-hero-left { flex: 1; min-width: 0; }
  .gf-hero h2 { font-size: 20px; font-weight: 800; margin: 0; line-height: 1.2; }
  .gf-hero p  { font-size: 12px; opacity: .82; margin: 3px 0 0; }

  /* Filters */
  .gf-filters {
    display: flex; gap: 15px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;
    background: #fff; padding: 14px 20px; border-radius: 14px;
    box-shadow: 0 4px 14px rgba(15,23,42,.05); border: 1px solid rgba(148,163,184,.18);
  }
  .gf-search-wrap { position: relative; flex: 1; min-width: 250px; }
  .gf-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 14px; pointer-events: none; }
  .gf-search-input {
    width: 100%; padding: 10px 14px 10px 38px; border-radius: 10px;
    border: 1px solid rgba(148,163,184,.3); font-size: 13px; outline: none; transition: border-color .15s, box-shadow .15s;
    background: #f8fafc;
  }
  .gf-search-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  
  .gf-select-wrap { display: flex; align-items: center; gap: 10px; }
  .gf-select-label { font-size: 12px; font-weight: 700; color: #475569; }
  .gf-select {
    padding: 10px 32px 10px 14px; border-radius: 10px; border: 1px solid rgba(148,163,184,.3);
    font-size: 13px; font-weight: 600; outline: none; background: #f8fafc; cursor: pointer; color: #1e293b;
    -webkit-appearance: none; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%2364748b' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    transition: border-color .15s, box-shadow .15s;
  }
  .gf-select:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }

  /* Grid */
  .gf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .gf-card {
    background: #fff; border-radius: 14px; padding: 18px;
    border: 1px solid rgba(148,163,184,.18);
    box-shadow: 0 4px 14px rgba(15,23,42,.07);
    display: flex; flex-direction: column;
    position: relative;
    transition: transform .2s, box-shadow .2s;
  }
  .gf-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,23,42,.12); }
  
  .gf-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .gf-card-title-area { flex: 1; padding-right: 15px; }
  
  .gf-card-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 6px; line-height: 1.3; }
  .gf-card-code { font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 12px; }
  .gf-card-desc { font-size: 12px; color: #475569; margin-bottom: 16px; flex: 1; line-height: 1.5; }
  
  .gf-card-meta { 
    display: flex; gap: 12px; font-size: 11px; color: #94a3b8; 
    border-top: 1px solid rgba(148,163,184,.15); padding-top: 12px; 
  }
  .gf-card-meta-item { display: flex; align-items: center; gap: 4px; font-weight: 600; }
  
  .gf-clickable-meta { color: #2563eb; cursor: pointer; text-decoration: underline; text-decoration-color: transparent; transition: text-decoration-color .2s; }
  .gf-clickable-meta:hover { text-decoration-color: #2563eb; }
  
  .gf-badge { padding: 3px 8px; border-radius: 999px; font-weight: 700; font-size: 10px; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 8px; }
  .gf-badge-active { background: #dcfce7; color: #15803d; }
  .gf-badge-inactive { background: #fee2e2; color: #b91c1c; }

  /* 3-Dot Menu */
  .gf-menu-wrapper { position: absolute; top: 14px; right: 14px; }
  .gf-menu-btn {
    background: none; border: none; font-size: 18px; color: #94a3b8; cursor: pointer;
    width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: background .2s, color .2s; line-height: 1;
  }
  .gf-menu-btn:hover, .gf-menu-btn.active { background: #f1f5f9; color: #0f172a; }
  
  .gf-dropdown {
    position: absolute; right: 0; top: 32px; background: #fff;
    border-radius: 10px; box-shadow: 0 10px 25px rgba(15,23,42,.15);
    border: 1px solid rgba(148,163,184,.18); width: 160px; z-index: 10;
    overflow: hidden; animation: gf-fade-in .15s ease;
  }
  .gf-dropdown-item {
    padding: 10px 14px; font-size: 12px; font-weight: 600; color: #475569;
    display: flex; align-items: center; gap: 8px; cursor: pointer;
    transition: background .15s, color .15s; border-bottom: 1px solid rgba(148,163,184,.08);
  }
  .gf-dropdown-item:last-child { border-bottom: none; }
  .gf-dropdown-item:hover { background: #f8fafc; color: #0f172a; }
  .gf-dropdown-item.danger { color: #dc2626; }
  .gf-dropdown-item.danger:hover { background: #fef2f2; }
  .gf-dropdown-item.warning { color: #d97706; }
  .gf-dropdown-item.warning:hover { background: #fffbeb; }

  @keyframes gf-fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

  /* Modals */
  .gf-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.55);
    z-index: 1050; display: flex; align-items: center; justify-content: center;
  }
  .gf-modal {
    background: #fff; border-radius: 16px; width: 90%; max-width: 500px;
    max-height: 90vh; display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(15,23,42,.28);
  }
  .gf-modal-large { max-width: 800px; }
  
  .gf-modal-hdr {
    background: linear-gradient(135deg,#1e3a8a,#2563eb);
    color: #fff; border-radius: 16px 16px 0 0;
    padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
  }
  .gf-modal-hdr h5 { font-size: 16px; font-weight: 800; margin: 0; }
  .gf-modal-close { background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; opacity: .8; line-height: 1; padding: 0; }
  .gf-modal-body { padding: 20px; flex: 1; overflow-y: auto; }
  
  /* Form inputs */
  .gf-form-group { margin-bottom: 15px; }
  .gf-label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 5px; }
  .gf-input, .gf-textarea {
    width: 100%; padding: 10px 12px; border-radius: 8px;
    border: 1px solid rgba(148,163,184,.3); font-size: 13px;
    outline: none; transition: border-color .15s;
  }
  .gf-input:focus, .gf-textarea:focus { border-color: #2563eb; }
  .gf-input:disabled { background: #f1f5f9; cursor: not-allowed; }
  .gf-textarea { resize: vertical; min-height: 80px; }
  .gf-checkbox-wrapper { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer; }

  .gf-input-error { border-color: #ef4444 !important; background-color: #fef2f2; }
  .gf-error-text { font-size: 11px; color: #dc2626; margin-top: 4px; font-weight: 500; }

  .gf-modal-ftr { padding: 12px 20px; border-top: 1px solid #e9ecef; background: #f8f9fa; border-radius: 0 0 16px 16px; display: flex; gap: 10px; justify-content: flex-end; }
  .gf-btn-primary {
    padding: 8px 18px; border-radius: 8px; border: none; font-size: 13px; font-weight: 700;
    background: linear-gradient(135deg,#1e3a8a,#2563eb); color: #fff; cursor: pointer; transition: opacity .15s;
  }
  .gf-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .gf-btn-secondary {
    padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
    background: #fff; color: #64748b; border: 1px solid #e2e8f0; cursor: pointer; transition: background .15s;
  }
  .gf-btn-secondary:hover:not(:disabled) { background: #f8fafc; }

  /* Questions Table */
  .gf-q-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .gf-q-table th, .gf-q-table td { padding: 10px 12px; border-bottom: 1px solid rgba(148,163,184,.15); text-align: left; }
  .gf-q-table th { font-weight: 700; color: #475569; background: #f8fafc; position: sticky; top: -20px; z-index: 1; }
  .gf-q-table tr:hover { background: #f8fafc; }
  .gf-q-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #e2e8f0; color: #475569; }

  /* Dropzone for File Upload */
  .gf-dropzone {
    border: 2px dashed rgba(37,99,235,.4); border-radius: 10px; padding: 28px 16px;
    text-align: center; background: #eff6ff; cursor: pointer;
    transition: background .2s, border-color .2s;
  }
  .gf-dropzone:hover { background: #e0f2fe; border-color: #2563eb; }
  .gf-dropzone-icon { font-size: 32px; color: #2563eb; display: block; margin-bottom: 8px; }
  .gf-dropzone-text { font-size: 13px; font-weight: 600; color: #1e3a8a; margin-bottom: 3px; }
  .gf-dropzone-hint { font-size: 11px; color: #64748b; }
`;

export default function GenerateForm() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Create/Edit form modal
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    code: "", name: "", sequence: 10, prerequisiteCode: "", description: "", active: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 3-dot Menu
  const [activeMenu, setActiveMenu] = useState(null);

  // Questions Modal
  const [qModal, setQModal] = useState({ open: false, form: null, loading: false, data: [], error: null });

  // Upload Questions Modal
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState({ type: "", text: "" });

  const { showToast } = useToast();

  // Close menus when clicking outside
  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get("/api/admin/forms", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForms(response.data);
    } catch (err) {
      console.error("Error fetching forms:", err);
      setError("Failed to load forms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  // Filtered Data
  const filteredForms = forms.filter(form => {
    // Search match
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (form.name && form.name.toLowerCase().includes(searchLower)) ||
      (form.code && form.code.toLowerCase().includes(searchLower)) ||
      (form.description && form.description.toLowerCase().includes(searchLower));

    // Status match
    let matchesStatus = true;
    if (filterStatus === "ACTIVE") matchesStatus = form.active === true;
    if (filterStatus === "INACTIVE") matchesStatus = form.active === false;

    return matchesSearch && matchesStatus;
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateNew = () => {
    setIsEdit(false);
    setFormData({ code: "", name: "", sequence: 10, prerequisiteCode: "", description: "", active: true });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (form) => {
    setIsEdit(true);
    setFormData({
      code: form.code,
      name: form.name,
      sequence: form.sequence || 10,
      prerequisiteCode: form.prerequisiteCode || "",
      description: form.description || "",
      active: form.active
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    let errs = {};
    if (!formData.code || formData.code.trim() === "") errs.code = "Form Code is required.";
    else if (/\s/.test(formData.code)) errs.code = "Form Code cannot contain spaces.";

    if (!formData.name || formData.name.trim() === "") errs.name = "Form Name is required.";

    if (formData.sequence === "" || formData.sequence === null) errs.sequence = "Sequence is required.";
    else if (isNaN(formData.sequence) || Number(formData.sequence) <= 0) errs.sequence = "Sequence must be a positive number.";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        ...formData,
        sequence: Number(formData.sequence),
        prerequisiteCode: formData.prerequisiteCode || null
      };

      if (isEdit) {
        await axios.put(`/api/admin/forms/${formData.code}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post("/api/admin/forms", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowModal(false);
      showToast(isEdit ? "Form updated successfully" : "Form created successfully", "success");
      fetchForms();
    } catch (err) {
      console.error("Error saving form:", err);
      setError(err.response?.data?.message || "Failed to save form.");
      showToast(err.response?.data?.message || "Failed to save form.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (code, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this form?`)) return;
    try {
      const token = localStorage.getItem("authToken");
      const endpoint = currentStatus ? `/api/admin/forms/${code}/deactivate` : `/api/admin/forms/${code}/activate`;
      await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Form ${currentStatus ? 'deactivated' : 'activated'} successfully`, "success");
      fetchForms();
    } catch (err) {
      console.error("Error toggling active status:", err);
      showToast("Failed to toggle status.", "error");
    }
  };

  const handleDelete = async (code, isPermanent) => {
    const msg = isPermanent
      ? `Are you sure you want to PERMANENTLY delete form ${code}? This action cannot be undone.`
      : `Are you sure you want to soft delete form ${code}?`;

    if (!window.confirm(msg)) return;

    try {
      const token = localStorage.getItem("authToken");
      const endpoint = `/api/admin/forms/${code}${isPermanent ? '?permanent=true' : ''}`;
      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Form deleted successfully`, "success");
      fetchForms();
    } catch (err) {
      console.error("Error deleting form:", err);
      showToast("Failed to delete form.", "error");
    }
  };

  const handleViewQuestions = async (form) => {
    setQModal({ open: true, form, loading: true, data: [], error: null });
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`/api/admin/forms/${form.code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQModal(prev => ({ ...prev, loading: false, data: res.data.questions || [] }));
    } catch (err) {
      console.error("Error fetching questions:", err);
      setQModal(prev => ({ ...prev, loading: false, error: "Failed to load questions." }));
    }
  };

  const toggleMenu = (e, code) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === code ? null : code);
  };

  const openUploadModal = () => {
    setUploadFile(null);
    setUploadMsg({ type: "", text: "" });
    setUploadModal(true);
  };

  const validateFile = (file) => {
    if (!file) return false;

    // Check file extension
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      setUploadMsg({ type: "error", text: "Invalid file type. Only .xlsx, .xls, and .csv are allowed." });
      setUploadFile(null);
      return false;
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadMsg({ type: "error", text: "File size exceeds the 5MB limit. Please upload a smaller file." });
      setUploadFile(null);
      return false;
    }

    return true;
  };

  const handleFileUploadSubmit = async () => {
    if (!uploadFile) {
      setUploadMsg({ type: "error", text: "Please select an Excel file to upload." });
      return;
    }
    setUploading(true);
    setUploadMsg({ type: "", text: "" });
    try {
      const token = localStorage.getItem("authToken");
      const formDataUpload = new FormData();
      formDataUpload.append("file", uploadFile);

      const r = await axios.post("/api/admin/forms/import-excel", formDataUpload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setUploadMsg({ type: "success", text: r.data?.message || "Questions uploaded successfully!" });
      fetchForms(); // Refresh the counts

      // Optionally auto close after success
      setTimeout(() => {
        setUploadModal(false);
      }, 2000);

    } catch (err) {
      console.error("Error uploading questions:", err);
      setUploadMsg({ type: "error", text: err.response?.data?.message || "Error uploading file. Please check the format and try again." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Base title="Generate Form">
      <style>{css}</style>
      <div className="container-fluid page-body-wrapper gf-page">
        <div className="main-panel">
          <div className="content-wrapper" style={{ background: "transparent" }}>
            <div className="gf-frame">
              <div className="gf-hero">
                <div className="gf-hero-left">
                  <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: 0, marginBottom: '8px', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                  >
                    ← Back to Dashboard
                  </button>
                  <h2>Form Management</h2>
                  <p>View existing forms, create new ones, update details or change active status.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{ borderRadius: 12, fontWeight: 700, fontSize: 13, padding: "8px 18px", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", cursor: "pointer" }}
                    onClick={openUploadModal}
                  >
                    ↑ Upload Questions
                  </button>
                  <button
                    type="button"
                    style={{ borderRadius: 12, fontWeight: 700, fontSize: 13, padding: "8px 18px", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", cursor: "pointer" }}
                    onClick={handleCreateNew}
                  >
                    + Create New Form
                  </button>
                </div>
              </div>

              {/* Filters Section */}
              <div className="gf-filters">
                <div className="gf-search-wrap">
                  <span className="gf-search-icon">🔍</span>
                  <input
                    type="text"
                    className="gf-search-input"
                    placeholder="Search by Form Name, Code or Description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="gf-select-wrap">
                  <label className="gf-select-label">Status:</label>
                  <select
                    className="gf-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All Forms</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Inactive Only</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center" style={{ padding: 50 }}>
                  <img alt="loading" src="./images/loading.gif" style={{ height: 80 }} />
                </div>
              ) : error && !showModal && !qModal.open && !uploadModal ? (
                <div className="alert alert-danger" style={{ borderRadius: 10 }}>{error}</div>
              ) : (
                <div className="gf-grid">
                  {filteredForms.map(form => (
                    <div key={form.id} className="gf-card">

                      <div className="gf-menu-wrapper">
                        <button
                          className={`gf-menu-btn ${activeMenu === form.code ? 'active' : ''}`}
                          onClick={(e) => toggleMenu(e, form.code)}
                        >
                          ⋮
                        </button>
                        {activeMenu === form.code && (
                          <div className="gf-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div className="gf-dropdown-item" onClick={() => { setActiveMenu(null); handleEdit(form); }}>
                              <span>✎</span> Edit Form
                            </div>
                            <div className="gf-dropdown-item warning" onClick={() => { setActiveMenu(null); handleToggleActive(form.code, form.active); }}>
                              <span>{form.active ? '⏹' : '▶'}</span> {form.active ? 'Deactivate' : 'Activate'}
                            </div>
                            <div className="gf-dropdown-item danger" onClick={() => { setActiveMenu(null); handleDelete(form.code, false); }}>
                              <span>🗑</span> Soft Delete
                            </div>
                            <div className="gf-dropdown-item danger" onClick={() => { setActiveMenu(null); handleDelete(form.code, true); }}>
                              <span>⚠</span> Perm. Delete
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="gf-card-header">
                        <div className="gf-card-title-area">
                          <span className={`gf-badge ${form.active ? 'gf-badge-active' : 'gf-badge-inactive'}`}>
                            {form.active ? '● Active' : '○ Inactive'}
                          </span>
                          <div className="gf-card-title">{form.name}</div>
                          <div className="gf-card-code">{form.code} {form.prerequisiteCode && `| Pre: ${form.prerequisiteCode}`}</div>
                        </div>
                      </div>

                      <div className="gf-card-desc">{form.description}</div>

                      <div className="gf-card-meta">
                        <div className="gf-card-meta-item">
                          <span style={{ opacity: 0.6 }}>Seq:</span> {form.sequence}
                        </div>
                        <div className="gf-card-meta-item">
                          <span style={{ opacity: 0.6 }}>Questions:</span>
                          <span className="gf-clickable-meta" onClick={() => handleViewQuestions(form)}>
                            {form.questionCount || 0}
                          </span>
                        </div>
                        <div className="gf-card-meta-item">
                          <span style={{ opacity: 0.6 }}>Version:</span> {form.version}
                        </div>
                      </div>

                    </div>
                  ))}
                  {filteredForms.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#64748b', background: '#fff', borderRadius: '14px', border: '1px dashed rgba(148,163,184,.4)' }}>
                      No forms found matching your criteria.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Questions Modal */}
      {uploadModal && (
        <div className="gf-modal-overlay" onClick={() => !uploading && setUploadModal(false)}>
          <div className="gf-modal" onClick={e => e.stopPropagation()}>
            <div className="gf-modal-hdr">
              <h5>↑ Upload Excel Questions</h5>
              <button className="gf-modal-close" onClick={() => setUploadModal(false)} disabled={uploading}>×</button>
            </div>

            <div className="gf-modal-body">
              {/* Important Instruction Alert */}
              <div style={{ padding: "12px 16px", borderRadius: 8, background: "#fffbeb", borderLeft: "4px solid #f59e0b", marginBottom: 20, fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
                <strong>Important Instruction:</strong><br />
                In your Excel sheet, please ensure you put the exact <strong>'Form Name'</strong> of a form you have already created here. Questions are mapped by this form name. If the form name doesn't match an existing form perfectly, the questions will not be mapped to it.
              </div>

              {/* Drop zone */}
              <div className="gf-dropzone"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#2563eb"; }}
                onDragLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "rgba(37,99,235,.4)"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f && !uploading) {
                    if (validateFile(f)) {
                      setUploadFile(f);
                      setUploadMsg({ type: "", text: "" });
                    }
                  }
                }}
              >
                <input type="file" id="excel-file-upload" accept=".xlsx,.xls,.csv" style={{ display: "none" }} disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (validateFile(f)) {
                        setUploadFile(f);
                        setUploadMsg({ type: "", text: "" });
                      }
                    }
                    e.target.value = null; // Reset input to allow selecting the same file again
                  }} />
                <label htmlFor="excel-file-upload" style={{ cursor: uploading ? "not-allowed" : "pointer", marginBottom: 0, display: "block" }}>
                  <span className="gf-dropzone-icon">☁</span>
                  <div className="gf-dropzone-text">Click to browse or drag &amp; drop Excel file</div>
                  <div className="gf-dropzone-hint">Supported formats: .xlsx, .xls, .csv (Max 5MB)</div>
                </label>
              </div>

              {/* Selected file preview */}
              {uploadFile && (
                <div style={{ marginTop: 15, padding: "12px 16px", borderRadius: 8, background: "#f8fafc", border: "1px solid rgba(148,163,184,.3)", display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 24 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {uploadFile.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {(uploadFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback messages */}
              {uploadMsg.text && (
                <div style={{
                  marginTop: 15, padding: "10px 14px", borderRadius: 8, fontSize: 12,
                  background: uploadMsg.type === "error" ? "#fee2e2" : "#dcfce7",
                  borderLeft: `4px solid ${uploadMsg.type === "error" ? "#ef4444" : "#22c55e"}`,
                  color: uploadMsg.type === "error" ? "#7f1d1d" : "#14532d"
                }}>
                  <strong>{uploadMsg.type === "error" ? "Error" : "Success"}:</strong> {uploadMsg.text}
                </div>
              )}
            </div>

            <div className="gf-modal-ftr">
              <button type="button" className="gf-btn-secondary" onClick={() => setUploadModal(false)} disabled={uploading}>Cancel</button>
              <button type="button" className="gf-btn-primary" onClick={handleFileUploadSubmit} disabled={!uploadFile || uploading}>
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Form Modal */}
      {showModal && (
        <div className="gf-modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="gf-modal" onClick={e => e.stopPropagation()}>
            <div className="gf-modal-hdr">
              <h5>{isEdit ? 'Edit Form' : 'Create New Form'}</h5>
              <button className="gf-modal-close" onClick={() => setShowModal(false)} disabled={submitting}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="gf-modal-body">
                {error && <div className="alert alert-danger" style={{ padding: 10, fontSize: 13, borderRadius: 8 }}>{error}</div>}

                <div className="gf-form-group">
                  <label className="gf-label">Form Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="code" className={`gf-input ${formErrors.code ? 'gf-input-error' : ''}`} value={formData.code} onChange={handleChange} disabled={isEdit} placeholder="e.g. BASIC" />
                  {formErrors.code && <div className="gf-error-text">{formErrors.code}</div>}
                </div>

                <div className="gf-form-group">
                  <label className="gf-label">Form Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="name" className={`gf-input ${formErrors.name ? 'gf-input-error' : ''}`} value={formData.name} onChange={handleChange} placeholder="e.g. Basic Details" />
                  {formErrors.name && <div className="gf-error-text">{formErrors.name}</div>}
                </div>

                <div className="gf-form-group" style={{ display: 'flex', gap: 15 }}>
                  <div style={{ flex: 1 }}>
                    <label className="gf-label">Sequence <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="number" name="sequence" className={`gf-input ${formErrors.sequence ? 'gf-input-error' : ''}`} value={formData.sequence} onChange={handleChange} />
                    {formErrors.sequence && <div className="gf-error-text">{formErrors.sequence}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="gf-label">Prerequisite Code</label>
                    <input type="text" name="prerequisiteCode" className="gf-input" value={formData.prerequisiteCode} onChange={handleChange} placeholder="e.g. BASIC" />
                  </div>
                </div>

                <div className="gf-form-group">
                  <label className="gf-label">Description</label>
                  <textarea name="description" className="gf-textarea" value={formData.description} onChange={handleChange} placeholder="Brief description of the form" />
                </div>

                <div className="gf-form-group">
                  <label className="gf-checkbox-wrapper">
                    <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
                    Active Status
                  </label>
                </div>
              </div>

              <div className="gf-modal-ftr">
                <button type="button" className="gf-btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="gf-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Form')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {qModal.open && (
        <div className="gf-modal-overlay" onClick={() => setQModal({ ...qModal, open: false })}>
          <div className="gf-modal gf-modal-large" onClick={e => e.stopPropagation()}>
            <div className="gf-modal-hdr">
              <h5>Questions: {qModal.form?.name}</h5>
              <button className="gf-modal-close" onClick={() => setQModal({ ...qModal, open: false })}>×</button>
            </div>
            <div className="gf-modal-body" style={{ padding: 0 }}>
              {qModal.loading ? (
                <div className="text-center" style={{ padding: 40 }}>
                  <img alt="loading" src="./images/loading.gif" style={{ height: 60 }} />
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>Loading questions...</div>
                </div>
              ) : qModal.error ? (
                <div style={{ padding: 20 }}>
                  <div className="alert alert-danger" style={{ borderRadius: 8, margin: 0 }}>{qModal.error}</div>
                </div>
              ) : qModal.data.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  No questions found for this form.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="gf-q-table">
                    <thead>
                      <tr>
                        <th>Seq</th>
                        <th>Code</th>
                        <th>Label (EN)</th>
                        <th>Type</th>
                        <th>Mandatory</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qModal.data.map(q => (
                        <tr key={q.id}>
                          <td>{q.sequence}</td>
                          <td style={{ fontFamily: 'monospace', color: '#0f172a' }}>{q.code}</td>
                          <td style={{ fontWeight: 500, color: '#1e293b' }}>{q.labelEn}</td>
                          <td><span className="gf-q-badge">{q.answerType}</span></td>
                          <td>
                            {q.mandatory ?
                              <span style={{ color: '#b91c1c', fontWeight: 'bold' }}>Yes</span> :
                              <span style={{ color: '#64748b' }}>No</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="gf-modal-ftr">
              <button type="button" className="gf-btn-secondary" onClick={() => setQModal({ ...qModal, open: false })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Base>
  );
}
