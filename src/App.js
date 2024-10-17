import "./App.css";
import LanguageData from "../src/Data/LanguageList.json";
import {
  Button,
  Card,
  Dropdown,
  FieldV1,
  TopBar,
} from "@egovernments/digit-ui-components";
import { useState } from "react";
function App() {
 
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="main center-container mb-25">
      <TopBar
        actionFields={[
          <Dropdown
            customSelector="City"
            option={[
              { code: "citya", name: "City A" },
              { code: "cityb", name: "City B" },
              { code: "cityc", name: "City C" },
            ]}
            optionKey="name"
            select={function noRefCheck() {}}
            theme="light"
          />,
          <Dropdown
            customSelector="Language"
            option={[
              { code: "English", name: "English" },
              { code: "Hindi", name: "Hindi" },
            ]}
            optionKey="name"
            select={function noRefCheck() {}}
            selected={{ code: "English", name: "English" }}
            theme="light"
          />,
          <Dropdown
            option={[
              { code: "editProfile", icon: "Edit", name: "Edit Profile" },
              { code: "logout", icon: "Logout", name: "Logout" },
            ]}
            optionKey="name"
            profilePic={<ma fill="#0B4B66" />}
            select={function noRefCheck() {}}
            showArrow={false}
            theme="light"
          />,
        ]}
        className=""
        img=""
        language="English"
        logo=""
        onHamburgerClick={function noRefCheck() {}}
        onImageClick={function noRefCheck() {}}
        onLogoClick={function noRefCheck() {}}
        props={{}}
        showDeafultImg
        style={{}}
        theme="light"
        ulb="Digit UI UX Demo"
      />
      <br /> <br /> <br />
      <div className="PageBasedInputWrapper">
        <Card>
          <FieldV1
            charCount
            config={{
              step: "",
            }}
            description=""
            name={"name"}
            value={name}
            error=""
            infoMessage=""
            label="Username"
            onChange={(e) => setName(e.target.value)}
            className={"example-digit"}
            placeholder="Please enter username"
            populators={{
              customIcon: "",
              disableTextField: false,
              onIconSelection: function noRefCheck() {},
              prefix: "",
              resizeSmart: false,
              suffix: "",
              validation: {
                maxlength: "",
                minlength: "",
              },
            }}
            required
            type="text"
          />
          <FieldV1
            charCount
            config={{
              step: "",
            }}
            description="Please enter 6 digit password"
            error=""
            infoMessage=""
            label="Password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Please enter password"
            populators={{
              customIcon: "",
              disableTextField: false,
              onIconSelection: function noRefCheck() {},
              prefix: "",
              resizeSmart: false,
              suffix: "",
              validation: {
                maxlength: "",
                minlength: "",
              },
            }}
            required
            type="password"
            name={"password"}
            value={password}
          />

          <FieldV1
            additionalWrapperClass=""
            description=""
            error=""
             label="Language"
            errorStyle={null}
            inputRef={null}
            
            onChange={function noRefCheck() {}}
            populators={{
              addCategorySelectAllCheck: false,
              addSelectAllCheck: false,
              categorySelectAllLabel: "",
              chipsKey: "",
              clearLabel: "Clear All",
              defaultValue: "FEMALE",
              isSearchable: true,
              name: "genders",
              options: LanguageData,
              optionsCustomStyle: {},
              optionsKey: "name",
              selectAllLabel: "",
              showIcon: false,
            }}
            props={{
              data: LanguageData,
              isLoading: false,
            }}
            t={function noRefCheck() {}}
            type="dropdown"
          />

          <Button label={"Login"} onClick={() => console.log("CLICKED")} />

          <div
            style={{
              alignItems: "center",
              color: "#363636",
              display: "flex",
            }}
          >
            <Button
              className="custom-class"
              iconFill=""
              isSearchable
              label="More Action"
              onClick={function noRefCheck() {}}
              onOptionSelect={function noRefCheck() {}}
              options={[
                {
                  code: "Actiona",
                  name: "Action A",
                },
                {
                  code: "Actionb",
                  name: "Action B",
                },
                {
                  code: "Actionc",
                  name: "Action C",
                },
              ]}
              optionsKey="name"
              showBottom
              size=""
              style={{}}
              title=""
              type="actionButton"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
