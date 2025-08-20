import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import Base from "../Components/Base";
import axios from "axios";

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
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState({});
  const [errors, setErrors] = useState({});
  
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
    `/sukrtya/api/language-labels/getLabels?formId=2&regLId=${localStorage.getItem("language")}`, 
    []
  );

  const facilitiesEndpoint = useMemo(() => 
    `/sukrtya/api/facilities?UserId=${userId}&RegLid=${localStorage.getItem("language")}&MappingUserId=${mappingUserId}`,
    [userId, mappingUserId]
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

  // Fetch facilities data
  useEffect(() => {
    const fetchData = async () => {
      setDistrictLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(facilitiesEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
        
        // Process hierarchical data
        if (response.data && response.data.length > 0 && response.data[0].mappedFacilities) {
          const districtList = response.data[0].mappedFacilities.map(d => ({
            code: d.districtCode,
            name: d.districtName
          }));
          setDistricts(districtList);
        }
        setDistrictLoading(false);
       
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
      }
    };
    fetchData();
  }, [facilitiesEndpoint, navigate]);

  // Auto-select when only one district exists
  useEffect(() => {
    if (!districtLoading && districts.length === 1 && !selectedDistrict) {
      const only = districts[0];
      setSelectedDistrict(only.code);
      setSelectedBlock(null);
      setSelectedCluster(null);
      setBlocks([]);
      setClusters([]);
      setFacilities([]);
      setSelectedNames(prev => ({
        ...prev,
        district: only.name,
        block: "",
        cluster: ""
      }));
      localStorage.setItem("selectedDistrictName", only.name);
      localStorage.removeItem("selectedBlockName");
      localStorage.removeItem("selectedBlockCode");
      localStorage.removeItem("selectedClusterName");
    }
  }, [districtLoading, districts, selectedDistrict]);

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

  // Auto-select when only one block exists
  useEffect(() => {
    if (!blockLoading && blocks.length === 1 && !selectedBlock) {
      const only = blocks[0];
      const blockName = only?.blockName || "";
      setSelectedBlock(only.blockCode);
      setClusters([]);
      setSelectedCluster(null);
      setFacilities([]);
      setSelectedNames(prev => ({
        ...prev,
        block: blockName,
        cluster: ""
      }));
      localStorage.setItem("selectedBlockName", blockName);
      localStorage.setItem("selectedBlockCode", only.blockCode);
      localStorage.removeItem("selectedClusterName");
    }
  }, [blockLoading, blocks, selectedBlock]);

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

  // Auto-select when only one facility (cluster) exists
  useEffect(() => {
    if (!facilityLoading && clusters.length === 1 && !selectedCluster) {
      const only = clusters[0];
      setSelectedCluster(only.clusterId);
      setSelectedNames(prev => ({
        ...prev,
        cluster: only.clusterName
      }));
      localStorage.setItem("selectedClusterName", only.clusterName);
    }
  }, [facilityLoading, clusters, selectedCluster]);

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

  // Memoized filtered data
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
    profileName: localStorage.getItem("profileName"),
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
            <div className="row" style={headerStyles}>
              <div className="col-md-4">
                <h3 className="font-weight-bold text-capitalize">
                
                  <span className="text-success">{userInfo.profileName}</span>
                </h3>
                <h6 className="font-weight-normal mb-0">
                <span className="text-muted">Username : &nbsp;</span><span className="text-primary">{userInfo.username}</span>
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
                        <span className="text-success">Found {filteredData.length} VHSND Center(s)</span>
                      ) : searchText ? (
                        <span className="text-danger">No VHSND center found matching "{searchText}"</span>
                      ) : (
                        <span className="text-info">Total {facilities.length} VHSND Centers</span>
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
                    {(districtLoading || districts.length !== 1) && (
                      <option value="">{districtLoading ? "Loading districts..." : "Select District"}</option>
                    )}
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
                      {(blockLoading || blocks.length !== 1) && (
                        <option value="">{blockLoading ? "Loading blocks..." : "Select Block"}</option>
                      )}
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
                    {(facilityLoading || clusters.length !== 1) && (
                      <option value="">{facilityLoading ? "Loading facilities..." : "Select Facility"}</option>
                    )}
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
                        VHSND Center: <strong>{item.facilityName}</strong>
                        <br />
                        <small>NIN No.: {item.facilityNin}</small>
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
          </div>
        </div>
      </div>
    </Base>
  );
}
