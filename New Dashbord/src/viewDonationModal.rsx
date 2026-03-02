<ModalFrame
  id="viewDonationModal"
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
      id="viewDonationModalTitle"
      value="#### Donation Details"
      verticalAlign="center"
    />
  </Header>
  <Body>
    <KeyValue
      id="donationDetailsKeyValue"
      data="{
  id: 0,
  firstName: 'Chic',
  lastName: 'Footitt',
  email: 'chic.footitt@yahoo.com',
  website: 'https://chic.footitt.com',
  text: 'Nulla sit amet nibh at augue facilisis viverra quis id dui. Nullam mattis ultricies metus. Donec eros lorem, egestas vitae aliquam quis, rutrum a mauris',
  role: 'Viewer',
  teams: ['Workplace', 'Infrastructure'],
  enabled: true,
  createdAt: '2023-01-16T23:40:20.385Z',
}"
      editIcon="bold/interface-edit-pencil"
      enableSaveActions={true}
      groupLayout="singleColumn"
      itemLabelPosition="top"
      labelWrap={true}
    />
  </Body>
  <Footer>
    <Button id="closeDonationButton" text="Close">
      <Event
        id="7970f714"
        event="click"
        method="run"
        params={{ map: { src: "viewDonationModal.hide()" } }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
  </Footer>
</ModalFrame>
