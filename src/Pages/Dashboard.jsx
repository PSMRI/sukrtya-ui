import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import Base from "../Components/Base";
import axios from "axios";

// ── Scoped CSS (same design language as FacilityTrans) ──────────────────────
const css = `
  .db-page { background: linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 100%); min-height: 100vh; }
  .db-frame { max-width: 1100px; margin: 0 auto; padding: 0 0 40px; }

  /* Hero */
  .db-hero {
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
  .db-hero-left { flex: 1; min-width: 0; }
  .db-hero-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 11px; border-radius: 999px;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16);
    color: rgba(255,255,255,.88); font-size: 11px; font-weight: 700;
    letter-spacing: .04em; margin-bottom: 6px;
  }
  .db-hero h2 { font-size: 20px; font-weight: 800; margin: 0; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .db-hero p  { font-size: 12px; opacity: .82; margin: 3px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Stat grid */
  .db-stat-grid { display: grid; gap: 12px; margin-bottom: 20px; }
  .db-stat-grid-3 { grid-template-columns: repeat(3,1fr); }
  .db-stat-grid-2 { grid-template-columns: repeat(2,1fr); }
  @media (max-width:767px) {
    .db-stat-grid-3 { grid-template-columns: repeat(2,1fr); }
    .db-stat-grid-2 { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width:480px) {
    .db-stat-grid-3, .db-stat-grid-2 { grid-template-columns: 1fr 1fr; }
  }

  /* Stat card */
  .db-stat-card {
    border-radius: 14px; background: #fff;
    border: 1px solid rgba(148,163,184,.18);
    box-shadow: 0 3px 10px rgba(15,23,42,.06);
    padding: 14px 16px; display: flex; flex-direction: column;
  }
  .db-stat-section-label {
    font-size: 10px; font-weight: 800; letter-spacing: .06em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 2px;
  }
  .db-stat-val { font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1; }
  .db-stat-label { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 500; }

  /* Admin section header */
  .db-section-hdr {
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 4px 16px rgba(15,23,42,.07);
  }
  .db-section-hdr-bar {
    padding: 12px 18px;
    display: flex; align-items: center; gap: 10px;
  }
  .db-section-hdr-bar h5 { font-size: 14px; font-weight: 800; margin: 0; color: #fff; }

  /* Stat row inside section */
  .db-stat-rows { background: #fff; }
  .db-stat-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 18px;
    border-bottom: 1px solid rgba(148,163,184,.1);
    font-size: 13px;
  }
  .db-stat-row:last-child { border-bottom: none; }
  .db-stat-row-label { color: #475569; font-weight: 500; }
  .db-stat-row-badge {
    font-size: 12px; font-weight: 700; padding: 3px 10px;
    border-radius: 999px; min-width: 36px; text-align: center;
  }
  .db-badge-blue   { background: rgba(37,99,235,.12); color: #1d4ed8; }
  .db-badge-green  { background: #dcfce7; color: #15803d; }
  .db-badge-amber  { background: #fef3c7; color: #92400e; }
  .db-badge-red    { background: #fee2e2; color: #b91c1c; }
  .db-badge-purple { background: rgba(124,58,237,.12); color: #6d28d9; }
  .db-badge-gray   { background: #f1f5f9; color: #475569; }
  .db-badge-teal   { background: rgba(13,148,136,.1); color: #0f766e; }

  /* Filter card */
  .db-filter-card {
    border-radius: 14px; background: #fff;
    border: 1px solid rgba(148,163,184,.18);
    box-shadow: 0 3px 10px rgba(15,23,42,.06);
    padding: 16px 20px; margin-bottom: 16px;
  }
  .db-filter-title { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .db-filter-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
  @media (max-width:767px) { .db-filter-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width:420px) { .db-filter-grid { grid-template-columns: 1fr; } }

  .db-select {
    width: 100%; padding: 8px 10px; border-radius: 9px;
    border: 1px solid rgba(148,163,184,.3); font-size: 12px;
    color: #1e293b; background: #fff; outline: none;
    transition: border-color .15s, box-shadow .15s;
    -webkit-appearance: none; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%2394a3b8' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
    padding-right: 28px;
  }
  .db-select:focus { border-color: rgba(37,99,235,.4); box-shadow: 0 0 0 2px rgba(37,99,235,.18); }
  .db-select:disabled { opacity: .55; cursor: not-allowed; }

  .db-select-label { font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: .04em; }

  /* Breadcrumb trail */
  .db-trail {
    display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
    font-size: 12px; color: #475569; margin-bottom: 16px;
    padding: 8px 14px; border-radius: 9px;
    background: rgba(37,99,235,.05); border: 1px solid rgba(37,99,235,.1);
  }
  .db-trail-item { font-weight: 600; color: #1d4ed8; }
  .db-trail-sep { color: #94a3b8; }

  /* Search row */
  .db-search-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .db-search-wrap { position: relative; flex: 1; min-width: 180px; }
  .db-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
  .db-search-input {
    width: 100%; padding: 8px 10px 8px 32px; border-radius: 9px;
    border: 1px solid rgba(148,163,184,.3); font-size: 12px; color: #1e293b;
    background: #fff; outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .db-search-input:focus { border-color: rgba(37,99,235,.4); box-shadow: 0 0 0 2px rgba(37,99,235,.18); }
  .db-result-pill { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px; white-space: nowrap; }

  /* Facility cards grid */
  .db-fac-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  @media (max-width:900px) { .db-fac-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width:540px) { .db-fac-grid { grid-template-columns: 1fr; } }

  /* Facility card */
  .db-fac-card {
    border-radius: 14px; background: #fff;
    border: 1px solid rgba(148,163,184,.18);
    box-shadow: 0 4px 14px rgba(15,23,42,.07);
    overflow: hidden; display: flex; flex-direction: column;
    transition: box-shadow .2s, transform .2s;
  }
  .db-fac-card:hover { box-shadow: 0 8px 28px rgba(37,99,235,.13); transform: translateY(-2px); }
  .db-fac-card-top { padding: 14px 16px 10px; display: flex; align-items: flex-start; gap: 12px; }
  .db-fac-icon {
    flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px;
    background: linear-gradient(135deg,#1e3a8a,#2563eb);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .db-fac-name { font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 3px; }
  .db-fac-code { font-size: 11px; color: #94a3b8; font-weight: 500; }
  .db-fac-meta { padding: 0 16px 14px; flex: 1; }
  .db-fac-meta-row { display: flex; align-items: baseline; gap: 6px; font-size: 11px; padding: 3px 0; border-bottom: 1px solid rgba(148,163,184,.08); }
  .db-fac-meta-row:last-child { border-bottom: none; }
  .db-fac-meta-key { color: #94a3b8; font-weight: 600; min-width: 54px; }
  .db-fac-meta-val { color: #1e293b; font-weight: 600; }
  .db-fac-footer { padding: 10px 16px; border-top: 1px solid rgba(148,163,184,.12); background: #fafbff; }
  .db-fac-btn {
    width: 100%; padding: 8px; border-radius: 9px; border: none;
    background: linear-gradient(135deg,#1e3a8a,#2563eb);
    color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
    transition: opacity .15s, transform .15s;
  }
  .db-fac-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
  .db-fac-btn:disabled { opacity: .6; cursor: not-allowed; }

  /* Empty/prompt state */
  .db-empty {
    min-height: 180px; border-radius: 14px;
    background: linear-gradient(135deg,#f8fbff,#eff6ff);
    border: 1px dashed rgba(37,99,235,.25);
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center; padding: 32px;
  }
  .db-empty-icon { font-size: 36px; margin-bottom: 10px; }
  .db-empty-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 5px; }
  .db-empty-sub { font-size: 12px; color: #64748b; }

  /* Upload Modal */
  .db-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.55);
    z-index: 1050; display: flex; align-items: center; justify-content: center;
    animation: db-fade .25s ease;
  }
  .db-modal {
    background: #fff; border-radius: 16px; width: 90%; max-width: 480px;
    max-height: 90vh; display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(15,23,42,.28);
    animation: db-slide .3s ease;
  }
  .db-modal-hdr {
    background: linear-gradient(135deg,#667eea,#764ba2);
    color: #fff; border-radius: 16px 16px 0 0;
    padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
  }
  .db-modal-hdr h5 { font-size: 16px; font-weight: 800; margin: 0; }
  .db-modal-close { background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; opacity: .8; line-height: 1; padding: 0; }
  .db-modal-close:hover { opacity: 1; }
  .db-modal-body { padding: 20px; flex: 1; overflow-y: auto; }
  .db-modal-ftr { padding: 12px 20px; border-top: 1px solid #e9ecef; background: #f8f9fa; border-radius: 0 0 16px 16px; display: flex; gap: 8px; justify-content: flex-end; }

  .db-dropzone {
    border: 2px dashed #667eea; border-radius: 10px; padding: 28px 16px;
    text-align: center; background: #f8f9ff; cursor: pointer;
    transition: background .2s;
  }
  .db-dropzone:hover { background: #eef2ff; }
  .db-dropzone-icon { font-size: 32px; color: #667eea; display: block; margin-bottom: 8px; }
  .db-dropzone-text { font-size: 13px; font-weight: 600; color: #667eea; margin-bottom: 3px; }
  .db-dropzone-hint { font-size: 11px; color: #94a3b8; }

  .db-upload-btn {
    padding: 7px 20px; border-radius: 8px; border: none; font-size: 12px; font-weight: 700;
    background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; cursor: pointer;
    transition: opacity .15s, transform .15s; display: flex; align-items: center; gap: 6px;
  }
  .db-upload-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
  .db-upload-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
  .db-cancel-btn {
    padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;
    background: #fff; color: #64748b; border: 1px solid #e2e8f0; cursor: pointer;
    transition: background .15s;
  }
  .db-cancel-btn:hover:not(:disabled) { background: #f1f5f9; }
  .db-cancel-btn:disabled { opacity: .6; cursor: not-allowed; }

  @keyframes db-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes db-slide { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const normalizeMasterContext = (masterContext) => {
  const districtMap = new Map();
  (masterContext?.facilities || []).forEach((entry, index) => {
    const district = entry.district || {};
    const block = entry.block || {};
    const facility = entry.facility || {};
    const districtCode = String(district.id ?? `district-${index}`);
    if (!districtMap.has(districtCode)) {
      districtMap.set(districtCode, { districtCode, districtName: district.name || "Unknown District", blockMap: new Map() });
    }
    const districtRecord = districtMap.get(districtCode);
    const blockCode = String(block.id ?? `block-${index}`);
    if (!districtRecord.blockMap.has(blockCode)) {
      districtRecord.blockMap.set(blockCode, { blockCode, blockName: block.name || "Unknown Block", clusterMap: new Map() });
    }
    const blockRecord = districtRecord.blockMap.get(blockCode);
    const clusterId = Number(facility.id ?? index + 1);
    const clusterKey = String(clusterId);
    if (!blockRecord.clusterMap.has(clusterKey)) {
      blockRecord.clusterMap.set(clusterKey, { clusterId, clusterName: facility.name || "Facility", facilities: [] });
    }
    blockRecord.clusterMap.get(clusterKey).facilities.push({
      facilityId: facility.id, facilityName: facility.name, facilityNin: facility.code,
      facilityTypeId: facility.facilityType === "HWC" ? 8 : 8,
      facilityTypeCode: facility.facilityType, facilityType: facility.facilityType,
      assessmentId: 1, districtId: district.id, blockId: block.id,
    });
  });
  return [{ mappedFacilities: Array.from(districtMap.values()).map((district) => ({ districtCode: district.districtCode, districtName: district.districtName, blocks: Array.from(district.blockMap.values()).map((block) => ({ blockCode: block.blockCode, blockName: block.blockName, clusters: Array.from(block.clusterMap.values()) })) })) }];
};

// Stat row component
function StatRow({ label, value, badge = "blue" }) {
  return (
    <div className="db-stat-row">
      <span className="db-stat-row-label">{label}</span>
      <span className={`db-stat-row-badge db-badge-${badge}`}>{value}</span>
    </div>
  );
}

// Section card component (Admin)
function StatSection({ title, gradient, children }) {
  return (
    <div className="db-section-hdr">
      <div className="db-section-hdr-bar" style={{ background: gradient }}>
        <h5>{title}</h5>
      </div>
      <div className="db-stat-rows">{children}</div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, regLid, mappingUserId } = location.state || {};

  useEffect(() => {
    if (!userId || !mappingUserId) navigate("/login", { replace: true });
  }, [userId, mappingUserId, navigate]);

  const userRole = localStorage.getItem("role");

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState({});
  const [errors, setErrors] = useState({});
  const [adminDashboardData, setAdminDashboardData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const [uploadResponse, setUploadResponse] = useState(null);
  const [districtLoading, setDistrictLoading] = useState(true);
  const [blockLoading, setBlockLoading] = useState(false);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [states] = useState([{ code: "10", name: "BIHAR" }]);
  const [selectedState, setSelectedState] = useState("10");
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    setSelectedDistrict(null); setSelectedBlock(null); setSelectedCluster(null);
    setBlocks([]); setClusters([]); setFacilities([]);
  }, []);

  useEffect(() => {
    localStorage.removeItem("selectedDistrictName"); localStorage.removeItem("selectedBlockName");
    localStorage.removeItem("selectedBlockCode"); localStorage.removeItem("selectedClusterName");
  }, []);

  const [selectedNames, setSelectedNames] = useState(() => ({ state: "BIHAR", district: "", block: "", cluster: "" }));

  const labelEndpoint = useMemo(() => `/api/language-labels/getLabels?formId=2&regLId=${localStorage.getItem("language")}`, []);
  const facilitiesEndpoint = useMemo(() => "/api/me/master-context", []);

  useEffect(() => {
    const fetchLabel = async () => {
      try { const r = await axios.get(labelEndpoint); setLabels(r.data[0]); }
      catch (e) { console.error("Error fetching labels:", e); }
    };
    fetchLabel();
  }, [labelEndpoint]);

  useEffect(() => {
    if (userRole === "ADMIN") {
      const fetchAdminDashboard = async () => {
        setAdminLoading(true);
        try {
          const token = localStorage.getItem("authToken");
          const r = await axios.get("/api/admin/dashboard/summary", { headers: { Authorization: `Bearer ${token}` } });
          setAdminDashboardData(r.data);
        } catch (e) {
          console.error("Error fetching admin dashboard:", e);
          setErrors(prev => ({ ...prev, admin: e.response?.data?.message || "Error loading admin dashboard" }));
        } finally { setAdminLoading(false); }
      };
      fetchAdminDashboard();
    }
  }, [userRole]);

  useEffect(() => {
    const fetchData = async () => {
      setDistrictLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const r = await axios.get(facilitiesEndpoint, { headers: { Authorization: `Bearer ${token}` } });
        const normalizedData = normalizeMasterContext(r.data);
        setData(normalizedData);
        if (normalizedData?.[0]?.mappedFacilities) {
          setDistricts(normalizedData[0].mappedFacilities.map(d => ({ code: d.districtCode, name: d.districtName })));
        }
      } catch (e) {
        if (e.response?.status === 401) { alert("Session expired. Please log in again."); localStorage.removeItem("authToken"); navigate("/login"); }
        else setErrors({ global: e.response?.data?.message || "An unexpected error occurred. Please login again after logout." + e });
      } finally { setDistrictLoading(false); }
    };
    fetchData();
  }, [facilitiesEndpoint, navigate]);

  useEffect(() => {
    if (selectedDistrict && data.length > 0) {
      setBlockLoading(true);
      try {
        const district = data[0].mappedFacilities.find(d => d.districtCode === selectedDistrict);
        if (district) {
          setBlocks(district.blocks || []);
          setSelectedBlock(null); setClusters([]); setSelectedCluster(null); setFacilities([]);
          setSelectedNames(prev => ({ ...prev, district: district.districtName, block: "", cluster: "" }));
          localStorage.setItem("selectedDistrictName", district.districtName);
          localStorage.removeItem("selectedBlockName"); localStorage.removeItem("selectedBlockCode"); localStorage.removeItem("selectedClusterName");
        }
      } catch (e) { console.error("Error processing block data:", e); setErrors(prev => ({ ...prev, block: "Error loading blocks." })); setBlocks([]); }
      finally { setBlockLoading(false); }
    }
  }, [selectedDistrict, data]);

  useEffect(() => {
    if (selectedBlock && selectedDistrict && data.length > 0) {
      const district = data[0].mappedFacilities.find(d => d.districtCode === selectedDistrict);
      if (district) {
        const block = district.blocks.find(b => b.blockCode === selectedBlock);
        if (block) {
          setClusters(block.clusters); setSelectedCluster(null); setFacilities([]);
          setSelectedNames(prev => ({ ...prev, block: block.blockName, cluster: "" }));
        }
      }
    }
  }, [selectedBlock, selectedDistrict, data]);

  useEffect(() => {
    if (selectedCluster && selectedBlock && selectedDistrict && data.length > 0) {
      setFacilityLoading(true);
      const district = data[0].mappedFacilities.find(d => d.districtCode === selectedDistrict);
      if (district) {
        const block = district.blocks.find(b => b.blockCode === selectedBlock);
        if (block) {
          const cluster = block.clusters.find(c => c.clusterId === selectedCluster);
          if (cluster) { setFacilities(cluster.facilities); setSelectedNames(prev => ({ ...prev, cluster: cluster.clusterName })); }
        }
      }
      setFacilityLoading(false);
    }
  }, [selectedCluster, selectedBlock, selectedDistrict, data]);

  const handleSubmit = useCallback((item) => {
    setLoading(true);
    const facilityData = { ...item, assessmentId: Number(item.assessmentId || 1), facilityTypeId: Number(item.facilityTypeId || item.facilityTypeCode === "HSC-HWC" ? 8 : 8) };
    const serializedObject = JSON.stringify(facilityData);
    localStorage.setItem("assessmentID", facilityData.assessmentId.toString());
    localStorage.setItem("centername", item.facilityName);
    navigate("/facility-trans", { state: { object: serializedObject } });
    setLoading(false);
  }, [navigate]);

  const handleFileUpload = async () => {
    if (!uploadFile) { setUploadMessage({ type: "error", text: "Please select a file to upload" }); return; }
    setUploading(true); setUploadMessage({ type: "", text: "" }); setUploadResponse(null);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData(); formData.append("file", uploadFile);
      const r = await axios.post("/api/admin/masters/import-excel", formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      if (r.data?.success) { setUploadMessage({ type: "success", text: r.data?.message || "File uploaded successfully!" }); setUploadResponse(r.data); }
      else setUploadMessage({ type: "error", text: r.data?.message || "Upload failed. Please try again." });
    } catch (e) { setUploadMessage({ type: "error", text: e.response?.data?.message || "Error uploading file. Please try again." }); }
    finally { setUploading(false); }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false); setUploadFile(null);
    setUploadMessage({ type: "", text: "" }); setUploadResponse(null);
  };

  const filteredData = useMemo(() => {
    if (!selectedCluster || !facilities.length) return [];
    const q = searchText.toLowerCase();
    return facilities.filter(f => [f.facilityName, f.facilityNin, selectedNames.state, selectedNames.district, selectedNames.block, selectedNames.cluster].some(v => v && v.toString().toLowerCase().includes(q)));
  }, [searchText, facilities, selectedNames, selectedCluster]);

  const userInfo = useMemo(() => ({ profileName: localStorage.getItem("profileName")?.split(" ")[0], username: localStorage.getItem("username") }), []);

  const ad = adminDashboardData;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Base title="Dashboard">
      <style>{css}</style>
      <div className="container-fluid page-body-wrapper db-page">
        <div className="main-panel">
          <div className="content-wrapper" style={{ background: "transparent" }}>
            <div className="db-frame">

              {/* ── Hero ── */}
              <div className="db-hero">
                <div className="db-hero-left">
                  <div className="db-hero-pill">
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: "#22c55e", display: "inline-block" }} />
                    {userRole === "ADMIN" ? "Admin Dashboard" : "Facility Selection"}
                  </div>
                  <h2>{labels[4] || "Welcome"}, {userInfo.profileName || "User"}</h2>
                  <p>{userInfo.username || ""}</p>
                </div>
                {userRole === "ADMIN" && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={{ borderRadius: 12, fontWeight: 700, fontSize: 13, padding: "8px 18px", flexShrink: 0, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", cursor: "pointer" }}
                      onClick={() => navigate("/generate-form")}
                    >
                      📄 Generate Form
                    </button>
                    <button
                      type="button"
                      style={{ borderRadius: 12, fontWeight: 700, fontSize: 13, padding: "8px 18px", flexShrink: 0, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", cursor: "pointer" }}
                      onClick={() => { setShowUploadModal(true); setUploadFile(null); setUploadMessage({ type: "", text: "" }); setUploadResponse(null); }}
                    >
                      ↑ Import Excel
                    </button>
                  </div>
                )}
              </div>

              {/* ══════════════════ ADMIN VIEW ══════════════════ */}
              {userRole === "ADMIN" ? (
                <>
                  {adminLoading ? (
                    <div className="text-center" style={{ padding: 50 }}>
                      <img alt="loading" src="./images/loading.gif" style={{ height: 80 }} />
                      <p className="mt-3 text-muted" style={{ fontSize: 13 }}>Loading dashboard data...</p>
                    </div>
                  ) : ad ? (
                    <>
                      {/* Top-level stat strip */}
                      <div className="db-stat-grid db-stat-grid-3" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                        {[
                          { label: "Total Districts", value: ad.geography?.totalDistricts || 0 },
                          { label: "Total Blocks", value: ad.geography?.totalBlocks || 0 },
                          { label: "Total Facilities", value: ad.geography?.totalFacilities || 0 },
                        ].map(({ label, value }) => (
                          <div key={label} className="db-stat-card">
                            <div className="db-stat-section-label">{label}</div>
                            <div className="db-stat-val">{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Detail sections grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
                        <StatSection title="Geography" gradient="linear-gradient(135deg,#1e3a8a,#2563eb)">
                          <StatRow label="Active Districts" value={ad.geography?.activeDistricts || 0} badge="green" />
                          <StatRow label="Active Blocks" value={ad.geography?.activeBlocks || 0} badge="green" />
                          <StatRow label="Active Facilities" value={ad.geography?.activeFacilities || 0} badge="green" />
                        </StatSection>

                        <StatSection title="Active Staff Assignments" gradient="linear-gradient(135deg,#065f46,#059669)">
                          <StatRow label="CHO" value={ad.activeStaffAssignmentsByRole?.cho || 0} badge="teal" />
                          <StatRow label="ANM" value={ad.activeStaffAssignmentsByRole?.anm || 0} badge="teal" />
                          <StatRow label="ASHA Facilitator" value={ad.activeStaffAssignmentsByRole?.ashaFacilitator || 0} badge="teal" />
                          <StatRow label="ASHA" value={ad.activeStaffAssignmentsByRole?.asha || 0} badge="amber" />
                        </StatSection>

                        <StatSection title="Worker Assignment Status" gradient="linear-gradient(135deg,#92400e,#f59e0b)">
                          <StatRow label="Active" value={ad.facilityWorkerAssignmentsByStatus?.active || 0} badge="green" />
                          <StatRow label="Disabled" value={ad.facilityWorkerAssignmentsByStatus?.disabled || 0} badge="red" />
                          <StatRow label="Unmapped" value={ad.facilityWorkerAssignmentsByStatus?.unmapped || 0} badge="gray" />
                        </StatSection>

                        <StatSection title="Portal User Facilities" gradient="linear-gradient(135deg,#0f766e,#2dd4bf)">
                          <StatRow label="Facilities with Active Users" value={ad.portalUserFacility?.distinctFacilitiesWithActivePortalUser || 0} badge="blue" />
                          <StatRow label="Active Facilities without Users" value={ad.portalUserFacility?.activeFacilitiesWithoutPortalUser || 0} badge="amber" />
                          <StatRow label="Total Portal Users" value={ad.portalUserFacility?.totalPortalUsers || 0} badge="blue" />
                          <StatRow label="Enabled Users" value={ad.portalUserFacility?.enabledPortalUsers || 0} badge="green" />
                        </StatSection>

                        <StatSection title="CHO at Active Facilities" gradient="linear-gradient(135deg,#7c3aed,#a78bfa)">
                          <StatRow label="With Active CHO" value={ad.choAtActiveFacilities?.activeFacilitiesWithActiveCho || 0} badge="green" />
                          <StatRow label="Without Active CHO" value={ad.choAtActiveFacilities?.activeFacilitiesWithoutActiveCho || 0} badge="red" />
                        </StatSection>

                        <StatSection title="Health Workers" gradient="linear-gradient(135deg,#334155,#64748b)">
                          <StatRow label="Total Workers" value={ad.healthWorkers?.total || 0} badge="blue" />
                          <StatRow label="Active Workers" value={ad.healthWorkers?.active || 0} badge="green" />
                        </StatSection>
                      </div>
                    </>
                  ) : (
                    <div className="db-empty">
                      <div className="db-empty-icon">📊</div>
                      <div className="db-empty-title">No dashboard data available</div>
                      <div className="db-empty-sub">Admin summary could not be loaded.</div>
                    </div>
                  )}
                  {errors.admin && <div className="alert alert-danger mt-3" style={{ borderRadius: 10 }}>{errors.admin}</div>}
                </>

              ) : (
                /* ══════════════════ REGULAR USER VIEW ══════════════════ */
                <>
                  {/* Filter card */}
                  <div className="db-filter-card">
                    <div className="db-filter-title">
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 3h14M3 8h10M5 13h6" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      Select Location &amp; Facility
                    </div>
                    <div className="db-filter-grid">
                      {/* State */}
                      <div>
                        <label className="db-select-label">State</label>
                        <select className="db-select" value={selectedState} onChange={(e) => { const v = e.target.value; setSelectedState(v); setSelectedNames(prev => ({ ...prev, state: states.find(s => s.code === v)?.name || "BIHAR" })); localStorage.setItem("selectedStateName", states.find(s => s.code === v)?.name || "BIHAR"); }}>
                          {states.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                        </select>
                      </div>

                      {/* District */}
                      <div>
                        <label className="db-select-label">District</label>
                        <select className="db-select" value={selectedDistrict || ""} disabled={districtLoading}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) { setSelectedDistrict(null); setSelectedBlock(null); setSelectedCluster(null); setBlocks([]); setClusters([]); setFacilities([]); setSelectedNames(prev => ({ ...prev, district: "", block: "", cluster: "" })); localStorage.removeItem("selectedDistrictName"); localStorage.removeItem("selectedBlockName"); localStorage.removeItem("selectedBlockCode"); localStorage.removeItem("selectedClusterName"); }
                            else { const name = districts.find(d => d.code === v)?.name || ""; setSelectedDistrict(v); setSelectedBlock(null); setSelectedCluster(null); setBlocks([]); setClusters([]); setFacilities([]); setSelectedNames(prev => ({ ...prev, district: name, block: "", cluster: "" })); localStorage.setItem("selectedDistrictName", name); localStorage.removeItem("selectedBlockName"); localStorage.removeItem("selectedBlockCode"); localStorage.removeItem("selectedClusterName"); }
                          }}>
                          <option value="">{districtLoading ? "Loading..." : "Select District"}</option>
                          {!districtLoading && districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                        </select>
                      </div>

                      {/* Block */}
                      <div>
                        <label className="db-select-label">Block</label>
                        <select className="db-select" value={selectedBlock || ""} disabled={!selectedDistrict || blockLoading}
                          onChange={(e) => {
                            const v = e.target.value;
                            setErrors(prev => ({ ...prev, block: null }));
                            try {
                              if (!v) { setSelectedBlock(null); setClusters([]); setSelectedCluster(null); setFacilities([]); setSelectedNames(prev => ({ ...prev, block: "", cluster: "" })); localStorage.removeItem("selectedBlockName"); localStorage.removeItem("selectedBlockCode"); localStorage.removeItem("selectedClusterName"); }
                              else { const bd = blocks.find(b => b.blockCode === v); const bn = bd?.blockName || ""; setSelectedBlock(v); setClusters([]); setSelectedCluster(null); setFacilities([]); setSelectedNames(prev => ({ ...prev, block: bn, cluster: "" })); localStorage.setItem("selectedBlockName", bn); localStorage.setItem("selectedBlockCode", v); localStorage.removeItem("selectedClusterName"); }
                            } catch (err) { console.error(err); setErrors(prev => ({ ...prev, block: "Error selecting block." })); }
                          }}>
                          <option value="">{blockLoading ? "Loading..." : "Select Block"}</option>
                          {!blockLoading && blocks.map(b => <option key={b.blockCode} value={b.blockCode}>{b.blockName}</option>)}
                        </select>
                        {errors.block && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>{errors.block}</div>}
                      </div>

                      {/* Facility/Cluster */}
                      <div>
                        <label className="db-select-label">Facility</label>
                        <select className="db-select" value={selectedCluster || ""} disabled={!selectedBlock || facilityLoading}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : "";
                            if (!v) { setSelectedCluster(null); setSelectedNames(prev => ({ ...prev, cluster: "" })); localStorage.removeItem("selectedClusterName"); }
                            else { const cn = clusters.find(c => c.clusterId === v)?.clusterName || ""; setSelectedCluster(v); setSelectedNames(prev => ({ ...prev, cluster: cn })); localStorage.setItem("selectedClusterName", cn); }
                          }}>
                          <option value="">{facilityLoading ? "Loading..." : "Select Facility"}</option>
                          {!facilityLoading && clusters.map(c => <option key={c.clusterId} value={c.clusterId}>{c.clusterName}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Breadcrumb trail */}
                  {(selectedNames.district || selectedNames.block || selectedNames.cluster) && (
                    <div className="db-trail">
                      <span style={{ color: "#64748b", fontWeight: 600 }}>Location:</span>
                      <span className="db-trail-item">BIHAR</span>
                      {selectedNames.district && <><span className="db-trail-sep">›</span><span className="db-trail-item">{selectedNames.district}</span></>}
                      {selectedNames.block && <><span className="db-trail-sep">›</span><span className="db-trail-item">{selectedNames.block}</span></>}
                      {selectedNames.cluster && <><span className="db-trail-sep">›</span><span className="db-trail-item">{selectedNames.cluster}</span></>}
                    </div>
                  )}

                  {/* Search + result count */}
                  {selectedCluster && (
                    <div className="db-search-row">
                      <div className="db-search-wrap">
                        <svg className="db-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                        <input className="db-search-input" type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={labels[2] || "Search facilities..."} />
                      </div>
                      {filteredData.length > 0 ? (
                        <span className="db-result-pill" style={{ background: "#dcfce7", color: "#15803d" }}>
                          {filteredData.length} center{filteredData.length !== 1 ? "s" : ""} found
                        </span>
                      ) : searchText ? (
                        <span className="db-result-pill" style={{ background: "#fee2e2", color: "#b91c1c" }}>No results</span>
                      ) : (
                        <span className="db-result-pill" style={{ background: "rgba(37,99,235,.1)", color: "#1d4ed8" }}>
                          {facilities.length} total
                        </span>
                      )}
                    </div>
                  )}

                  {/* Facility cards */}
                  {selectedCluster ? (
                    filteredData.length > 0 ? (
                      <div className="db-fac-grid">
                        {filteredData.map((item, idx) => (
                          <div className="db-fac-card" key={item.facilityNin || idx}>
                            <div className="db-fac-card-top">
                              <div className="db-fac-icon">🏥</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="db-fac-name">{item.facilityName}</div>
                                <div className="db-fac-code">Code: {item.facilityNin}</div>
                              </div>
                            </div>
                            <div className="db-fac-meta">
                              {[
                                { key: labels[6] || "State", val: selectedNames.state },
                                { key: labels[7] || "District", val: selectedNames.district },
                                { key: labels[8] || "Block", val: selectedNames.block },
                                { key: "Facility", val: selectedNames.cluster },
                              ].map(({ key, val }) => (
                                <div className="db-fac-meta-row" key={key}>
                                  <span className="db-fac-meta-key">{key}</span>
                                  <span className="db-fac-meta-val">{val}</span>
                                </div>
                              ))}
                            </div>
                            <div className="db-fac-footer">
                              <button className="db-fac-btn" disabled={loading} onClick={() => handleSubmit(item)}>
                                {loading ? "Please Wait..." : labels[3] || "Select Facility"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="db-empty">
                        <div className="db-empty-icon">🔍</div>
                        <div className="db-empty-title">No results found</div>
                        <div className="db-empty-sub">No facility matches "{searchText}"</div>
                      </div>
                    )
                  ) : (
                    <div className="db-empty">
                      <div className="db-empty-icon">🏥</div>
                      <div className="db-empty-title">Select a Facility to Continue</div>
                      <div className="db-empty-sub">Use the dropdowns above to drill down to your facility.</div>
                    </div>
                  )}

                  {errors.global && <p style={{ color: "#dc2626", marginTop: 12, fontSize: 13 }}>{errors.global}</p>}
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Upload Modal ── */}
      {showUploadModal && (
        <div className="db-modal-overlay" onClick={!uploading && !uploadResponse ? handleCloseUploadModal : undefined}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="db-modal-hdr">
              <h5>↑ Import Excel Data</h5>
              <button className="db-modal-close" onClick={handleCloseUploadModal} disabled={uploading}>×</button>
            </div>

            {/* Body */}
            <div className="db-modal-body">
              {!uploadResponse ? (
                <>
                  {/* Drop zone */}
                  <div className="db-dropzone"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = "#eef2ff"; }}
                    onDragLeave={(e) => { e.currentTarget.style.background = "#f8f9ff"; }}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && !uploading) { setUploadFile(f); setUploadMessage({ type: "", text: "" }); } }}
                  >
                    <input type="file" id="excel-file-input" accept=".xlsx,.xls,.csv" style={{ display: "none" }} disabled={uploading}
                      onChange={(e) => { setUploadFile(e.target.files?.[0]); setUploadMessage({ type: "", text: "" }); }} />
                    <label htmlFor="excel-file-input" style={{ cursor: uploading ? "not-allowed" : "pointer", marginBottom: 0 }}>
                      <span className="db-dropzone-icon">☁</span>
                      <div className="db-dropzone-text">Click to select or drag &amp; drop</div>
                      <div className="db-dropzone-hint">Supported: <strong>.xlsx, .xls, .csv</strong></div>
                    </label>
                  </div>

                  {/* Selected file info */}
                  {uploadFile && (
                    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "#eff6ff", border: "1px solid rgba(37,99,235,.2)", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 20 }}>📄</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#1d4ed8" }}>{uploadFile.name}</div>
                        <div style={{ fontSize: 11, color: "#60a5fa" }}>{(uploadFile.size / 1024).toFixed(2)} KB</div>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {uploadMessage.type === "error" && (
                    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "#fee2e2", borderLeft: "4px solid #ef4444", fontSize: 12, color: "#7f1d1d" }}>
                      <strong>Error:</strong> {uploadMessage.text}
                    </div>
                  )}
                </>
              ) : (
                /* Success */
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}>✓</div>
                  <h5 style={{ color: "#15803d", fontWeight: 800, marginBottom: 4 }}>Import Successful!</h5>
                  <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>{uploadMessage.text}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "12px", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Rows Imported</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#1d4ed8" }}>{uploadResponse.rowsImported || 0}</div>
                    </div>
                    <div style={{ background: "#fefce8", borderLeft: "4px solid #f59e0b", padding: "12px", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Rows Skipped</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{uploadResponse.rowsSkipped || 0}</div>
                    </div>
                  </div>
                  {uploadResponse.messages?.length > 0 && (
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Import Details ({uploadResponse.messages.length} messages)</div>
                      <div style={{ background: "#f8faff", borderRadius: 8, maxHeight: 150, overflowY: "auto", padding: "10px 12px", border: "1px solid rgba(148,163,184,.2)", fontSize: 11 }}>
                        <ul style={{ paddingLeft: 18, margin: 0 }}>
                          {uploadResponse.messages.slice(0, 6).map((msg, i) => <li key={i} style={{ marginBottom: 4, color: "#475569" }}>{msg}</li>)}
                          {uploadResponse.messages.length > 6 && <li style={{ color: "#2563eb", fontWeight: 700 }}>... +{uploadResponse.messages.length - 6} more</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="db-modal-ftr">
              {!uploadResponse ? (
                <>
                  <button className="db-cancel-btn" onClick={handleCloseUploadModal} disabled={uploading}>Cancel</button>
                  <button className="db-upload-btn" onClick={handleFileUpload} disabled={uploading || !uploadFile}>
                    {uploading ? <><span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} role="status" /><span>Uploading...</span></> : <><span>↑</span><span>Upload</span></>}
                  </button>
                </>
              ) : (
                <button className="db-upload-btn" style={{ background: "linear-gradient(135deg,#15803d,#22c55e)" }} onClick={handleCloseUploadModal}>✓ Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </Base>
  );
}
