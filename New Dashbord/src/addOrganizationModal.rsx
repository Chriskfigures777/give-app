<ModalFrame
  id="addOrganizationModal"
  footerPadding="8px 12px"
  headerPadding="8px 12px"
  hidden={true}
  hideOnEscape={true}
  isHiddenOnMobile={true}
  overlayInteraction={true}
  padding="8px 12px"
  showFooter={true}
  showHeader={true}
  showOverlay={true}
  size="medium"
>
  <Header>
    <Text
      id="addOrgModalTitle"
      value="#### Add New Organization"
      verticalAlign="center"
    />
  </Header>
  <Body>
    <TextInput
      id="newOrgName"
      label="Organization name"
      labelPosition="top"
      placeholder="Enter organization name"
    />
    <TextInput
      id="newOrgSlug"
      label="URL slug"
      labelPosition="top"
      placeholder="organization-slug"
    />
    <TextInput
      id="newOrgEmail"
      label="Contact email"
      labelPosition="top"
      placeholder="contact@organization.org"
    />
    <Select
      id="newOrgType"
      allowDeselect={true}
      data={'{{ ["Option 1", "Option 2", "Option 3"] }}'}
      emptyMessage="No options"
      label="Organization type"
      labelPosition="top"
      labels="{{ item }}"
      overlayMaxHeight={375}
      placeholder="Select type"
      showSelectionIndicator={true}
      values="{{ item }}"
    >
      <Option id="00030" value="Option 1" />
      <Option id="00031" value="Option 2" />
      <Option id="00032" value="Option 3" />
    </Select>
  </Body>
  <Footer>
    <Button id="cancelAddOrgButton" styleVariant="outline" text="Cancel">
      <Event
        id="daed7150"
        event="click"
        method="run"
        params={{ map: { src: "addOrganizationModal.hide()" } }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
    <Button id="confirmAddOrgButton" text="Add organization">
      <Event
        id="ad7dc5d1"
        event="click"
        method="run"
        params={{ map: { src: "addOrganizationScript.trigger()" } }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
  </Footer>
</ModalFrame>
