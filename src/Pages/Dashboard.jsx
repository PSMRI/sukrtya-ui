import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import Base from "../Components/Base";
import axios from "axios";

const normalizeMasterContext = (masterContext) => {
  const districtMap = new Map();

  (masterContext?.facilities || []).forEach((entry, index) => {
    const district = entry.district || {};
    const block = entry.block || {};
    const facility = entry.facility || {};

    const districtCode = String(district.id ?? `district-${index}`);
    if (!districtMap.has(districtCode)) {
      districtMap.set(districtCode, {
        districtCode,
        districtName: district.name || "Unknown District",
        blockMap: new Map(),
      });
    }

    const districtRecord = districtMap.get(districtCode);
    const blockCode = String(block.id ?? `block-${index}`);

    if (!districtRecord.blockMap.has(blockCode)) {
      districtRecord.blockMap.set(blockCode, {
        blockCode,
        blockName: block.name || "Unknown Block",
        clusterMap: new Map(),
      });
    }

    const blockRecord = districtRecord.blockMap.get(blockCode);
    const clusterId = Number(facility.id ?? index + 1);
    const clusterKey = String(clusterId);

    if (!blockRecord.clusterMap.has(clusterKey)) {
      blockRecord.clusterMap.set(clusterKey, {
        clusterId,
        clusterName: facility.name || "Facility",
        facilities: [],
      });
    }

    blockRecord.clusterMap.get(clusterKey).facilities.push({
      facilityId: facility.id,
      facilityName: facility.name,
      facilityNin: facility.code,
      facilityTypeId: facility.facilityType === "HWC" ? 8 : 8,
      facilityTypeCode: facility.facilityType,
      facilityType: facility.facilityType,
      assessmentId: 1,
      districtId: district.id,
      blockId: block.id,
    });
  });

  return [
    {
      mappedFacilities: Array.from(districtMap.values()).map((district) => ({
        districtCode: district.districtCode,
        districtName: district.districtName,
        blocks: Array.from(district.blockMap.values()).map((block) => ({
          blockCode: block.blockCode,
          blockName: block.blockName,
          clusters: Array.from(block.clusterMap.values()),
        })),
      })),
    },
  ];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
 // Fallback to empty object if location.state is undefined/null
  const { userId, regLid, mappingUserId } = location.state || {};

  // Redirect if required params are missing
  useEffect(() => {
    if (!userId || !mappingUserId) {
      navigate("/login", { replace: true });
    }
  }, [userId, mappingUserId, navigate]);
  
  // Get user role
  const userRole = localStorage.getItem("role");
  
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState({});
  const [errors, setErrors] = useState({});
  
  // Admin dashboard state
  const [adminDashboardData, setAdminDashboardData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const [uploadResponse, setUploadResponse] = useState(null);
  
  // Loading states for dropdowns
  const [districtLoading, setDistrictLoading] = useState(true);
  const [blockLoading, setBlockLoading] = useState(false);
  const [facilityLoading, setFacilityLoading] = useState(false);
  
  // States for hierarchical selection
  const [states] = useState([{ code: "10", name: "BIHAR" }]);
  const [selectedState, setSelectedState] = useState("10");
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [facilities, setFacilities] = useState([]);

  // Reset selections on component mount/refresh
  useEffect(() => {
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedCluster(null);
    setBlocks([]);
    setClusters([]);
    setFacilities([]);
  }, []);
  
  // Clear localStorage on initial load/refresh
  useEffect(() => {
    localStorage.removeItem("selectedDistrictName");
    localStorage.removeItem("selectedBlockName");
    localStorage.removeItem("selectedBlockCode");
    localStorage.removeItem("selectedClusterName");
  }, []);

  // Selected names for display
  const [selectedNames, setSelectedNames] = useState(() => ({
    state: "BIHAR",
    district: "",
    block: "",
    cluster: ""
  }));

  // Memoized API endpoints
  const labelEndpoint = useMemo(() => 
    `/api/language-labels/getLabels?formId=2&regLId=${localStorage.getItem("language")}`, 
    []
  );

  const facilitiesEndpoint = useMemo(() => 
    "/api/me/master-context",
    []
  );

  // Fetch labels
  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(labelEndpoint);
        setLabels(labelResponse.data[0]);
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };
    fetchLabel();
  }, [labelEndpoint]);

  // Fetch admin dashboard data
  useEffect(() => {
    if (userRole === "ADMIN") {
      const fetchAdminDashboard = async () => {
        setAdminLoading(true);
        try {
          const token = localStorage.getItem("authToken");
          const response = await axios.get("/api/admin/dashboard/summary", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAdminDashboardData(response.data);
        } catch (error) {
          console.error("Error fetching admin dashboard:", error);
          setErrors(prev => ({
            ...prev,
            admin: error.response?.data?.message || "Error loading admin dashboard"
          }));
        } finally {
          setAdminLoading(false);
        }
      };
      fetchAdminDashboard();
    }
  }, [userRole]);

  // Fetch facilities data
  useEffect(() => {
    const fetchData = async () => {
      setDistrictLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(facilitiesEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const normalizedData = normalizeMasterContext(response.data);
        setData(normalizedData);

        if (normalizedData && normalizedData.length > 0 && normalizedData[0].mappedFacilities) {
          const districtList = normalizedData[0].mappedFacilities.map(d => ({
            code: d.districtCode,
            name: d.districtName
          }));
          setDistricts(districtList);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("authToken");
          navigate("/login");
        } else {
          setErrors({
            global: error.response?.data?.message || 
                   "An unexpected error occurred. Please login again after logout."+error
          });
        }
      } finally {
        setDistrictLoading(false);
      }
    };
    fetchData();
  }, [facilitiesEndpoint, navigate]);

  // Effect for updating blocks when district is selected
  useEffect(() => {
    if (selectedDistrict && data.length > 0) {
      setBlockLoading(true);
      try {
        const district = data[0].mappedFacilities.find(d => d.districtCode === selectedDistrict);
        if (district) {
          // Ensure blocks data exists and is an array
          const blocksData = district.blocks || [];
          setBlocks(blocksData);
          
          // Reset block and facility selections when district changes
          setSelectedBlock(null);
          setClusters([]);
          setSelectedCluster(null);
          setFacilities([]);
          setSelectedNames(prev => ({
            ...prev,
            district: district.districtName,
            block: "",
            cluster: ""
          }));
          
          // Update localStorage
          localStorage.setItem("selectedDistrictName", district.districtName);
          localStorage.removeItem("selectedBlockName");
          localStorage.removeItem("selectedBlockCode");
          localStorage.removeItem("selectedClusterName");
        }
      } catch (error) {
        console.error("Error processing block data:", error);
        setErrors(prev => ({
          ...prev,
          block: "Error loading blocks. Please try again."
        }));
        setBlocks([]);
      } finally {
        setBlockLoading(false);
      }
    }
  }, [selectedDistrict, data]);

  // Effect for updating clusters when block is selected
  useEffect(() => {
    if (selectedBlock && selectedDistrict && data.length > 0) {
      const district = data[0].mappedFacilities.find(d => d.districtCode === selectedDistrict);
      if (district) {
        const block = district.blocks.find(b => b.blockCode === selectedBlock);
        if (block) {
          setClusters(block.clusters);
          setSelectedCluster(null);
          setFacilities([]);
          setSelectedNames(prev => ({
            ...prev,
            block: block.blockName,
            cluster: ""
          }));
        }
      }
    }
  }, [selectedBlock, selectedDistrict, data]);

  // Effect for updating facilities when cluster is selected
  useEffect(() => {
    if (selectedCluster && selectedBlock && selectedDistrict && data.length > 0) {
      setFacilityLoading(true);
      const district = data[0].mappedFacilities.find(d => d.districtCode === selectedDistrict);
      if (district) {
        const block = district.blocks.find(b => b.blockCode === selectedBlock);
        if (block) {
          const cluster = block.clusters.find(c => c.clusterId === selectedCluster);
          if (cluster) {
            setFacilities(cluster.facilities);
            setSelectedNames(prev => ({
              ...prev,
              cluster: cluster.clusterName
            }));
          }
        }
      }
      setFacilityLoading(false);
    }
  }, [selectedCluster, selectedBlock, selectedDistrict, data]);

  // Memoized handler functions
  const handleSubmit = useCallback((item) => {
    
      setLoading(true);
      
      // Create object with the required fields and ensure the values are properly extracted
      const facilityData = {
        ...item,
        assessmentId: Number(item.assessmentId || 1), // Ensure assessmentId is a number and default to 1 if not present
        facilityTypeId: Number(item.facilityTypeId || item.facilityTypeCode === "HSC-HWC" ? 8 : 8) // Set 8 for HSC-HWC, otherwise 0
      };

      //console.log('Facility Data:', facilityData);
      const serializedObject = JSON.stringify(facilityData);
      localStorage.setItem("assessmentID", facilityData.assessmentId.toString());
      localStorage.setItem("centername", item.facilityName);
      navigate("/facility-trans", { state: { object: serializedObject } });
      setLoading(false);
     
  }, [navigate]);

  // Handle Excel file upload
  const handleFileUpload = async () => {
    if (!uploadFile) {
      setUploadMessage({ type: "error", text: "Please select a file to upload" });
      return;
    }

    setUploading(true);
    setUploadMessage({ type: "", text: "" });
    setUploadResponse(null);
    
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await axios.post("/api/admin/masters/import-excel", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        setUploadMessage({ 
          type: "success", 
          text: response.data?.message || "File uploaded successfully!" 
        });
        setUploadResponse(response.data);
      } else {
        setUploadMessage({
          type: "error",
          text: response.data?.message || "Upload failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadMessage({
        type: "error",
        text: error.response?.data?.message || "Error uploading file. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle modal close
  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadMessage({ type: "", text: "" });
    setUploadResponse(null);
  };
  const filteredData = useMemo(() => {
    if (!selectedCluster || !facilities.length) return [];
    
    const searchLower = searchText.toLowerCase();
    return facilities.filter((facility) => {
      const searchableFields = [
        facility.facilityName,
        facility.facilityNin,
        selectedNames.state,
        selectedNames.district,
        selectedNames.block,
        selectedNames.cluster
      ];
      
      return searchableFields.some(field => 
        field && field.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [searchText, facilities, selectedNames, selectedCluster]);

  // Memoized user info
  const userInfo = useMemo(() => ({
    profileName: localStorage.getItem("profileName")?.split(" ")[0],
    username: localStorage.getItem("username")
  }), []);

  const headerStyles = {
    display: "flex",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    backgroundColor: "#f0f0f0",
    borderRadius: "8px",
  };

  return (
    <Base title="Dashboard">
      <div className="container-fluid page-body-wrapper">
        <div className="main-panel">
          <div className="content-wrapper">
            {userRole === "ADMIN" ? (
              // Admin Dashboard
              <>
                <div className="row" style={headerStyles}>
                  <div className="col-md-6">
                    <h3 className="font-weight-bold text-capitalize">
                      {labels[4] || "Welcome"},
                      <span className="text-success">{userInfo.profileName}</span>
                    </h3>
                    <h6 className="font-weight-normal mb-0">
                      <span className="text-primary">Admin Dashboard</span>
                    </h6>
                  </div>
                  <div className="col-md-6 text-right">
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setShowUploadModal(true);
                        setUploadFile(null);
                        setUploadMessage({ type: "", text: "" });
                        setUploadResponse(null);
                      }}
                    >
                      <i className="icon-upload"></i> Import Excel
                    </button>
                  </div>
                </div>

                {adminLoading ? (
                  <div className="text-center" style={{ padding: "50px" }}>
                    <img
                      alt="loading"
                      src="./images/loading.gif"
                      style={{ height: "100px" }}
                    />
                    <p className="mt-3">Loading dashboard data...</p>
                  </div>
                ) : adminDashboardData ? (
                  <div className="row mt-4">
                    {/* Geography Section */}
                    <div className="col-md-4 mb-4">
                      <div className="card bg-light">
                        <div className="card-header bg-primary text-white">
                          <h5 className="mb-0 font-weight-bold">Geography</h5>
                        </div>
                        <div className="card-body">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td><strong>Total Districts</strong></td>
                                <td className="text-right"><span className="badge badge-primary">{adminDashboardData.geography?.totalDistricts || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Active Districts</strong></td>
                                <td className="text-right"><span className="badge badge-success">{adminDashboardData.geography?.activeDistricts || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Total Blocks</strong></td>
                                <td className="text-right"><span className="badge badge-primary">{adminDashboardData.geography?.totalBlocks || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Active Blocks</strong></td>
                                <td className="text-right"><span className="badge badge-success">{adminDashboardData.geography?.activeBlocks || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Total Facilities</strong></td>
                                <td className="text-right"><span className="badge badge-primary">{adminDashboardData.geography?.totalFacilities || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Active Facilities</strong></td>
                                <td className="text-right"><span className="badge badge-success">{adminDashboardData.geography?.activeFacilities || 0}</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Staff Assignments Section */}
                    <div className="col-md-4 mb-4">
                      <div className="card bg-light">
                        <div className="card-header bg-success text-white">
                          <h5 className="mb-0 font-weight-bold">Active Staff Assignments</h5>
                        </div>
                        <div className="card-body">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td><strong>CHO</strong></td>
                                <td className="text-right"><span className="badge badge-info">{adminDashboardData.activeStaffAssignmentsByRole?.cho || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>ANM</strong></td>
                                <td className="text-right"><span className="badge badge-info">{adminDashboardData.activeStaffAssignmentsByRole?.anm || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>ASHA Facilitator</strong></td>
                                <td className="text-right"><span className="badge badge-info">{adminDashboardData.activeStaffAssignmentsByRole?.ashaFacilitator || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>ASHA</strong></td>
                                <td className="text-right"><span className="badge badge-warning">{adminDashboardData.activeStaffAssignmentsByRole?.asha || 0}</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Worker Assignments Status Section */}
                    <div className="col-md-4 mb-4">
                      <div className="card bg-light">
                        <div className="card-header bg-warning text-dark">
                          <h5 className="mb-0 font-weight-bold">Worker Assignments Status</h5>
                        </div>
                        <div className="card-body">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td><strong>Active</strong></td>
                                <td className="text-right"><span className="badge badge-success">{adminDashboardData.facilityWorkerAssignmentsByStatus?.active || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Disabled</strong></td>
                                <td className="text-right"><span className="badge badge-danger">{adminDashboardData.facilityWorkerAssignmentsByStatus?.disabled || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Unmapped</strong></td>
                                <td className="text-right"><span className="badge badge-secondary">{adminDashboardData.facilityWorkerAssignmentsByStatus?.unmapped || 0}</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Portal User Facilities Section */}
                    <div className="col-md-4 mb-4">
                      <div className="card bg-light">
                        <div className="card-header bg-info text-white">
                          <h5 className="mb-0 font-weight-bold">Portal User Facilities</h5>
                        </div>
                        <div className="card-body">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td><strong>Facilities with Active Users</strong></td>
                                <td className="text-right"><span className="badge badge-primary">{adminDashboardData.portalUserFacility?.distinctFacilitiesWithActivePortalUser || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Active Facilities without Users</strong></td>
                                <td className="text-right"><span className="badge badge-warning">{adminDashboardData.portalUserFacility?.activeFacilitiesWithoutPortalUser || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Total Portal Users</strong></td>
                                <td className="text-right"><span className="badge badge-success">{adminDashboardData.portalUserFacility?.totalPortalUsers || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Enabled Users</strong></td>
                                <td className="text-right"><span className="badge badge-success">{adminDashboardData.portalUserFacility?.enabledPortalUsers || 0}</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* CHO at Facilities Section */}
                    <div className="col-md-4 mb-4">
                      <div className="card bg-light">
                        <div className="card-header bg-danger text-white">
                          <h5 className="mb-0 font-weight-bold">CHO at Active Facilities</h5>
                        </div>
                        <div className="card-body">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td><strong>Facilities with Active CHO</strong></td>
                                <td className="text-right"><span className="badge badge-success">{adminDashboardData.choAtActiveFacilities?.activeFacilitiesWithActiveCho || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Facilities without Active CHO</strong></td>
                                <td className="text-right"><span className="badge badge-danger">{adminDashboardData.choAtActiveFacilities?.activeFacilitiesWithoutActiveCho || 0}</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Health Workers Section */}
                    <div className="col-md-4 mb-4">
                      <div className="card bg-light">
                        <div className="card-header bg-secondary text-white">
                          <h5 className="mb-0 font-weight-bold">Health Workers</h5>
                        </div>
                        <div className="card-body">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td><strong>Total Workers</strong></td>
                                <td className="text-right"><span className="badge badge-primary">{adminDashboardData.healthWorkers?.total || 0}</span></td>
                              </tr>
                              <tr>
                                <td><strong>Active Workers</strong></td>
                                <td className="text-right"><span className="badge badge-success">{adminDashboardData.healthWorkers?.active || 0}</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning mt-4">
                    No admin dashboard data available
                  </div>
                )}

                {errors.admin && (
                  <div className="alert alert-danger mt-3">
                    {errors.admin}
                  </div>
                )}
              </>
            ) : (
              // Regular User Dashboard
              <>
                <div className="row" style={headerStyles}>
              <div className="col-md-4">
                <h3 className="font-weight-bold text-capitalize">
                  {labels[4] || "Welcome"},
                  <span className="text-success">{userInfo.profileName}</span>
                </h3>
                <h6 className="font-weight-normal mb-0">
                  <span className="text-primary">{userInfo.username}</span>
                </h6>
              </div>
              <div className="col-md-4 mt-2" />
              <div className="col-md-4 mt-2">
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-primary text-white">
                      <i className="icon-search"></i>
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={labels[2] || "type here to search.."}
                  />
                </div>
                <p className="text-right">
                  <small>
                    {selectedCluster ? (
                      filteredData.length > 0 ? (
                        <span className="text-success">Found {filteredData.length}  Center(s)</span>
                      ) : searchText ? (
                        <span className="text-danger">No  center found matching "{searchText}"</span>
                      ) : (
                        <span className="text-info">Total {facilities.length}  Centers</span>
                      )
                    ) : (
                      <span className="text-warning">Please select a facility to see results</span>
                    )}
                  </small>
                </p>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-md-3">
                <div className="form-group">
                  <label>Select State</label>
                  <select 
                    className="form-control"
                    value={selectedState}
                    onChange={(e) => {
                      const value = e.target.value;
                      const stateName = states.find(s => s.code === value)?.name || "BIHAR";
                      setSelectedState(value);
                      setSelectedNames(prev => ({
                        ...prev,
                        state: stateName
                      }));
                      localStorage.setItem("selectedStateName", stateName);
                    }}
                  >
                    {states.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>Select District</label>
                  <select 
                    className="form-control"
                    value={selectedDistrict || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        // If "Select District" is chosen
                        setSelectedDistrict(null);
                        setSelectedBlock(null);
                        setSelectedCluster(null);
                        setBlocks([]);
                        setClusters([]);
                        setFacilities([]);
                        setSelectedNames(prev => ({
                          ...prev,
                          district: "",
                          block: "",
                          cluster: ""
                        }));
                        localStorage.removeItem("selectedDistrictName");
                        localStorage.removeItem("selectedBlockName");
                        localStorage.removeItem("selectedBlockCode");
                        localStorage.removeItem("selectedClusterName");
                      } else {
                        // If a specific district is chosen
                        const districtName = districts.find(d => d.code === value)?.name || "";
                        setSelectedDistrict(value);
                        setSelectedBlock(null);
                        setSelectedCluster(null);
                        setBlocks([]);
                        setClusters([]);
                        setFacilities([]);
                        setSelectedNames(prev => ({
                          ...prev,
                          district: districtName,
                          block: "",
                          cluster: ""
                        }));
                        localStorage.setItem("selectedDistrictName", districtName);
                        localStorage.removeItem("selectedBlockName");
                        localStorage.removeItem("selectedBlockCode");
                        localStorage.removeItem("selectedClusterName");
                      }
                    }}
                    disabled={districtLoading}
                  >
                    <option value="">{districtLoading ? "Loading districts..." : "Select District"}</option>
                    {!districtLoading && districts.map(district => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>Select Block</label>
                  <div>
                    <select 
                      className={`form-control ${errors.block ? 'is-invalid' : ''}`}
                      value={selectedBlock || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Clear any existing errors
                        setErrors(prev => ({ ...prev, block: null }));
                        try {
                          if (!value) {
                            // If "Select Block" is chosen
                            setSelectedBlock(null);
                            setClusters([]);
                            setSelectedCluster(null);
                            setFacilities([]);
                            setSelectedNames(prev => ({
                              ...prev,
                              block: "",
                              cluster: ""
                            }));
                            localStorage.removeItem("selectedBlockName");
                            localStorage.removeItem("selectedBlockCode");
                            localStorage.removeItem("selectedClusterName");
                          } else {
                            // If a specific block is chosen
                            const selectedBlockData = blocks.find(b => b.blockCode === value);
                            const blockName = selectedBlockData?.blockName || "";
                            
                            // Update block selection
                            setSelectedBlock(value);
                            setClusters([]);
                            setSelectedCluster(null);
                            setFacilities([]);
                            setSelectedNames(prev => ({
                              ...prev,
                              block: blockName,
                              cluster: ""
                            }));
                            
                            // Persist block selection
                            localStorage.setItem("selectedBlockName", blockName);
                            localStorage.setItem("selectedBlockCode", value);
                            localStorage.removeItem("selectedClusterName");
                          }
                        } catch (error) {
                          console.error("Error selecting block:", error);
                          setErrors(prev => ({
                            ...prev,
                            block: "Error selecting block. Please try again."
                          }));
                        }
                      }}
                      disabled={!selectedDistrict || blockLoading}
                    >
                      <option value="">{blockLoading ? "Loading blocks..." : "Select Block"}</option>
                      {!blockLoading && blocks.map(block => (
                        <option key={block.blockCode} value={block.blockCode}>
                          {block.blockName}
                        </option>
                      ))}
                    </select>
                    {errors.block && (
                      <div className="invalid-feedback d-block">
                        {errors.block}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label>Select Facility</label>
                  <select 
                    className="form-control"
                    value={selectedCluster || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : '';
                      if (!value) {
                        // If "Select Facility" is chosen
                        setSelectedCluster(null);
                        setSelectedNames(prev => ({
                          ...prev,
                          cluster: ""
                        }));
                        localStorage.removeItem("selectedClusterName");
                      } else {
                        // If a specific facility is chosen
                        const clusterName = clusters.find(c => c.clusterId === value)?.clusterName || "";
                        setSelectedCluster(value);
                        setSelectedNames(prev => ({
                          ...prev,
                          cluster: clusterName
                        }));
                        localStorage.setItem("selectedClusterName", clusterName);
                      }
                    }}
                    disabled={!selectedBlock || facilityLoading}
                  >
                    <option value="">{facilityLoading ? "Loading facilities..." : "Select Facility"}</option>
                    {!facilityLoading && clusters.map(cluster => (
                      <option key={cluster.clusterId} value={cluster.clusterId}>
                        {cluster.clusterName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="row mt-3">
                <div className="col-12">
                  <div className="alert alert-info">
                    <strong>Selected Location: </strong>
                    BIHAR
                    {selectedNames.district && ` > ${selectedNames.district}`}
                    {selectedNames.block && ` > ${selectedNames.block}`}
                    {selectedNames.cluster && ` > ${selectedNames.cluster}`}
                  </div>
                </div>
              </div>
            <div className="row mt-2">
              {selectedCluster && filteredData.map((item, index) => (
                <div className="col-md-4 mb-4" key={item.facilityNin || index}>
                  <div className="card rounded" style={{ backgroundColor: "#FBF6E9" }}>
                    <nav className="navbar">
                      <img
                        className="img-responsive"
                        src="/placeholder-image.png"
                        alt={item.facilityPhoto}
                        style={{ height: "70px", width: "70px" }}
                        loading="lazy"
                      />
                      <div style={{ textAlign: "right" }}>
                         <strong>{item.facilityName}</strong>
                        <br />
                        <small>Code: {item.facilityNin}</small>
                      </div>
                    </nav>
                    <div style={{ padding: "20px" }}>
                      <table>
                        <tbody>
                          <tr>
                            <td>{labels[6] || "State"}</td>
                            <td style={{ width: "20px" }}>:</td>
                            <td><strong>{selectedNames.state}</strong></td>
                          </tr>
                          <tr>
                            <td>{labels[7] || "District"}</td>
                            <td style={{ width: "20px" }}>:</td>
                            <td><strong>{selectedNames.district}</strong></td>
                          </tr>
                          <tr>
                            <td>{labels[8] || "Block"}</td>
                            <td style={{ width: "20px" }}>:</td>
                            <td><strong>{selectedNames.block}</strong></td>
                          </tr>
                          <tr>
                            <td>Facility</td>
                            <td style={{ width: "20px" }}>:</td>
                            <td><strong>{selectedNames.cluster}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="card-footer">
                      <button
                        style={{ width: "100%" }}
                        disabled={loading}
                        onClick={() => handleSubmit(item)}
                        className="btn btn-primary mr-2"
                      >
                        {loading ? "Please Wait..." : labels[3] || "Select"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.global && <p style={{ color: "red" }}>{errors.global}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1050,
            animation: "fadeIn 0.3s ease-in",
          }}
          onClick={!uploading && !uploadResponse ? handleCloseUploadModal : null}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "520px",
              width: "90%",
              maxHeight: "90vh",
              animation: "slideUp 0.4s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes slideUp { from { transform: translate(-50%, -20%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }
              .upload-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4); }
              .upload-btn:active:not(:disabled) { transform: translateY(0); }
            `}</style>
            <div className="modal-content" style={{ borderRadius: "12px", border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
              {/* Header */}
              <div 
                className="modal-header" 
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  borderTopLeftRadius: "12px",
                  borderTopRightRadius: "12px",
                  borderBottom: "none",
                  padding: "16px 20px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h5 className="modal-title font-weight-bold mb-0" style={{ fontSize: "18px", fontWeight: "600" }}>
                    <i className="icon-cloud-upload mr-2" style={{ fontSize: "20px" }}></i>Import Excel Data
                  </h5>
                </div>
                <button
                  type="button"
                  className="close text-white"
                  onClick={handleCloseUploadModal}
                  disabled={uploading}
                  style={{ 
                    cursor: uploading ? "not-allowed" : "pointer",
                    opacity: uploading ? 0.5 : 0.8,
                    fontSize: "28px",
                    padding: 0,
                    marginTop: "-8px",
                  }}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>

              {/* Body */}
              <div className="modal-body" style={{ padding: "20px 20px", flex: "1", overflowY: "auto", minHeight: 0 }}>
                {!uploadResponse ? (
                  <>
                    {/* File Selection Section */}
                    <div className="form-group mb-2">
                      <label className="font-weight-bold mb-2" style={{ fontSize: "13px", color: "#2c3e50", display: "block" }}>
                        <i className="icon-file mr-1" style={{ color: "#667eea", fontSize: "13px" }}></i>
                        Select Your Excel File
                      </label>
                      <div 
                        className="custom-file-upload"
                        style={{
                          border: "2px dashed #667eea",
                          borderRadius: "8px",
                          padding: "24px 16px",
                          textAlign: "center",
                          backgroundColor: "#f8f9ff",
                          cursor: uploading ? "not-allowed" : "pointer",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          opacity: uploading ? 0.6 : 1,
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (!uploading) e.currentTarget.style.backgroundColor = "#e7f0ff";
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8f9ff";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file && !uploading) {
                            setUploadFile(file);
                            setUploadMessage({ type: "", text: "" });
                          }
                        }}
                      >
                        <input
                          type="file"
                          className="form-control-file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setUploadFile(file);
                            setUploadMessage({ type: "", text: "" });
                          }}
                          disabled={uploading}
                          style={{ display: "none" }}
                          id="excel-file-input"
                        />
                        <label htmlFor="excel-file-input" style={{ cursor: "pointer", marginBottom: 0 }}>
                          <i className="icon-cloud-upload" style={{ fontSize: "32px", color: "#667eea", marginBottom: "8px", display: "block" }}></i>
                          <p style={{ color: "#667eea", fontWeight: "600", marginBottom: "3px", fontSize: "13px" }}>
                            Click to select or drag and drop
                          </p>
                          <small style={{ color: "#999", fontSize: "11px" }}>Supported: <strong>.xlsx, .xls, .csv</strong></small>
                        </label>
                      </div>
                    </div>

                    {/* Selected File Info */}
                    {uploadFile && (
                      <div 
                        className="alert mb-0 mt-2" 
                        style={{
                          backgroundColor: "#d1ecf1",
                          border: "1px solid #bee5eb",
                          borderRadius: "6px",
                          padding: "10px 12px",
                          marginBottom: "0",
                          animation: "slideUp 0.3s ease-out",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <i className="icon-file-check" style={{ color: "#0c5460", fontSize: "16px" }}></i>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: "#0c5460", display: "block", fontSize: "12px" }}>{uploadFile.name}</strong>
                            <small style={{ color: "#0c5460", opacity: 0.8, fontSize: "11px" }}>{(uploadFile.size / 1024).toFixed(2)} KB</small>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadMessage.type === "error" && (
                      <div 
                        className="alert alert-danger mt-2 mb-0" 
                        role="alert"
                        style={{
                          borderRadius: "6px",
                          borderLeft: "4px solid #dc3545",
                          padding: "10px 12px",
                          backgroundColor: "#f8d7da",
                          border: "1px solid #f5c6cb",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <i className="icon-alert-circle" style={{ color: "#721c24", fontSize: "14px", marginTop: "1px", flexShrink: 0 }}></i>
                          <div>
                            <strong style={{ color: "#721c24", fontSize: "12px" }}>Error</strong>
                            <p style={{ marginBottom: 0, marginTop: "2px", fontSize: "11px", color: "#721c24" }}>{uploadMessage.text}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Success Response Display */
                  <div style={{ animation: "slideUp 0.4s ease-out" }}>
                    {/* Success Header */}
                    <div style={{ textAlign: "center", marginBottom: "14px" }}>
                      <div 
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          backgroundColor: "#d4edda",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 10px",
                          boxShadow: "0 4px 12px rgba(40, 167, 69, 0.2)",
                        }}
                      >
                        <i className="icon-check-circle" style={{ color: "#28a745", fontSize: "28px" }}></i>
                      </div>
                      <h5 style={{ color: "#28a745", fontWeight: "600", marginBottom: "4px", fontSize: "16px" }}>
                        Import Successful!
                      </h5>
                      <p style={{ color: "#666", marginBottom: 0, fontSize: "12px", lineHeight: 1.4 }}>
                        {uploadMessage.text}
                      </p>
                    </div>

                    {/* Summary Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                      <div 
                        style={{
                          backgroundColor: "#f0f7ff",
                          borderLeft: "4px solid #0066cc",
                          padding: "12px 12px",
                          borderRadius: "6px",
                          textAlign: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                      >
                        <p style={{ color: "#666", fontSize: "9px", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.3px" }}>
                          Rows Imported
                        </p>
                        <h3 style={{ color: "#0066cc", fontWeight: "700", marginBottom: 0, fontSize: "22px" }}>
                          {uploadResponse.rowsImported || 0}
                        </h3>
                      </div>
                      <div 
                        style={{
                          backgroundColor: "#fff3cd",
                          borderLeft: "4px solid #ffc107",
                          padding: "12px 12px",
                          borderRadius: "6px",
                          textAlign: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                      >
                        <p style={{ color: "#666", fontSize: "9px", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.3px" }}>
                          Rows Skipped
                        </p>
                        <h3 style={{ color: "#ffc107", fontWeight: "700", marginBottom: 0, fontSize: "22px" }}>
                          {uploadResponse.rowsSkipped || 0}
                        </h3>
                      </div>
                    </div>

                    {/* Messages Section */}
                    {uploadResponse.messages && uploadResponse.messages.length > 0 && (
                      <div>
                        <h6 style={{ fontWeight: "600", marginBottom: "8px", color: "#2c3e50", fontSize: "12px" }}>
                          <i className="icon-info mr-1" style={{ color: "#667eea", fontSize: "12px" }}></i>
                          Import Details ({uploadResponse.messages.length} messages)
                        </h6>
                        <div 
                          style={{
                            backgroundColor: "#f8f9fa",
                            borderRadius: "6px",
                            maxHeight: "160px",
                            overflowY: "auto",
                            padding: "10px",
                            border: "1px solid #dee2e6",
                            fontSize: "11px",
                          }}
                        >
                          <ul style={{ marginBottom: 0, paddingLeft: "18px" }}>
                            {uploadResponse.messages.slice(0, 6).map((msg, idx) => (
                              <li key={idx} style={{ marginBottom: "4px", color: "#555", lineHeight: "1.3" }}>
                                {msg}
                              </li>
                            ))}
                            {uploadResponse.messages.length > 6 && (
                              <li style={{ marginTop: "6px", color: "#0066cc", fontWeight: "600", fontSize: "10px" }}>
                                ... +{uploadResponse.messages.length - 6} more
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div 
                className="modal-footer" 
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid #e9ecef",
                  backgroundColor: "#f8f9fa",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                {!uploadResponse ? (
                  <>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleCloseUploadModal}
                      disabled={uploading}
                      style={{
                        borderRadius: "4px",
                        padding: "6px 16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: "white",
                        color: "#666",
                        border: "1px solid #ddd",
                        cursor: uploading ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        opacity: uploading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => !uploading && (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={handleFileUpload}
                      disabled={uploading || !uploadFile}
                      style={{
                        borderRadius: "4px",
                        padding: "6px 18px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: uploading || !uploadFile ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        border: "none",
                        cursor: uploading || !uploadFile ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        opacity: uploading || !uploadFile ? 0.7 : 1,
                      }}
                    >
                      {uploading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                            style={{ width: "12px", height: "12px" }}
                          ></span>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <i className="icon-upload" style={{ fontSize: "13px" }}></i>
                          <span>Upload</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleCloseUploadModal}
                    style={{
                      borderRadius: "4px",
                      padding: "6px 18px",
                      fontSize: "12px",
                      fontWeight: "600",
                      width: "auto",
                      background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 10px rgba(40, 167, 69, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <i className="icon-check-circle" style={{ fontSize: "13px" }}></i>
                    <span>Done</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Base>
  );
}
