<Screen
  id="page1"
  _customShortcuts={[]}
  _hashParams={[]}
  _order={0}
  _searchParams={[]}
  browserTitle=""
  title="Page 1"
  urlSlug=""
  uuid="604e7ff0-8013-46dd-8f0c-3212d25643d4"
>
  <Function
    id="organizationFilterOptionsTransformer"
    funcBody={include(
      "../lib/organizationFilterOptionsTransformer.js",
      "string"
    )}
  />
  <Function
    id="filteredDonationsTransformer"
    funcBody={include("../lib/filteredDonationsTransformer.js", "string")}
  />
  <Function
    id="filteredOrganizationsTransformer"
    funcBody={include("../lib/filteredOrganizationsTransformer.js", "string")}
  />
  <Function
    id="totalDonationsTransformer"
    funcBody={include("../lib/totalDonationsTransformer.js", "string")}
  />
  <Function
    id="activeOrganizationsTransformer"
    funcBody={include("../lib/activeOrganizationsTransformer.js", "string")}
  />
  <Function
    id="totalDonorsTransformer"
    funcBody={include("../lib/totalDonorsTransformer.js", "string")}
  />
  <Function
    id="donationTrendsTransformer"
    funcBody={include("../lib/donationTrendsTransformer.js", "string")}
  />
  <Function
    id="orgDistributionTransformer"
    funcBody={include("../lib/orgDistributionTransformer.js", "string")}
  />
  <JavascriptQuery
    id="clearFiltersScript"
    notificationDuration={4.5}
    query={include("../lib/clearFiltersScript.js", "string")}
    resourceName="JavascriptQuery"
    showSuccessToaster={false}
  />
  <JavascriptQuery
    id="addOrganizationScript"
    notificationDuration={4.5}
    query={include("../lib/addOrganizationScript.js", "string")}
    resourceName="JavascriptQuery"
    showSuccessToaster={false}
  />
  <JavascriptQuery
    id="exportDataScript"
    notificationDuration={4.5}
    query={include("../lib/exportDataScript.js", "string")}
    resourceName="JavascriptQuery"
    showSuccessToaster={false}
  />
  <Include src="./addOrganizationModal.rsx" />
  <Include src="./viewDonationModal.rsx" />
  <Frame
    id="$main"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    type="main"
  >
    <Text
      id="appTitle2"
      value="# Give Platform Dashboard"
      verticalAlign="center"
    />
    <Button id="addOrgButton2" text="Add Org">
      <Event
        id="e8a8b0d0"
        event="click"
        method="run"
        params={{ map: { src: "modalFrame1.setHidden(false);" } }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
    <Button id="exportButton2" styleVariant="outline" text="Export">
      <Event
        id="b3f57986"
        event="click"
        method="run"
        params={{ map: { src: "exportDataScript.trigger();" } }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
    <Button id="settingsButton2" styleVariant="outline" text="Settings" />
    <Container
      id="filterContainer2"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{ border: "surfacePrimaryBorder", borderRadius: "8px" }}
    >
      <View id="00030" viewKey="View 1">
        <DateRange
          id="dateRangeFilter2"
          dateFormat="MMM d, yyyy"
          endPlaceholder="End date"
          iconBefore="bold/interface-calendar-remove"
          label="Filter by date range"
          labelPosition="top"
          startPlaceholder="Start date"
          textBetween="-"
          value={{ start: "", end: "" }}
        />
        <Select
          id="organizationFilter2"
          data="{{ organizationFilterOptionsTransformer.value }}"
          emptyMessage="No options"
          label="Filter by organization"
          labelPosition="top"
          labels="{{ item.label }}"
          overlayMaxHeight={375}
          placeholder="Select an organization"
          showClear={true}
          showSelectionIndicator={true}
          values="{{ item.value }}"
        >
          <Option id="00030" value="Option 1" />
          <Option id="00031" value="Option 2" />
          <Option id="00032" value="Option 3" />
        </Select>
        <Select
          id="statusFilter2"
          data="{{ [ { label: 'Succeeded', value: 'succeeded' }, { label: 'Pending', value: 'pending' }, { label: 'Failed', value: 'failed' } ] }}"
          emptyMessage="No options"
          label="Filter by status"
          labelPosition="top"
          labels="{{ item.label }}"
          overlayMaxHeight={375}
          placeholder="Select a status"
          showClear={true}
          showSelectionIndicator={true}
          values="{{ item.value }}"
        >
          <Option id="00030" value="Option 1" />
          <Option id="00031" value="Option 2" />
          <Option id="00032" value="Option 3" />
        </Select>
        <Button id="clearFiltersButton2" styleVariant="outline" text="Clear">
          <Event
            id="0c4adea9"
            event="click"
            method="run"
            params={{ map: { src: "clearFiltersScript.trigger();" } }}
            pluginId=""
            type="script"
            waitMs="0"
            waitType="debounce"
          />
        </Button>
      </View>
    </Container>
    <Container
      id="activeOrgsCard2"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{ border: "surfacePrimaryBorder", borderRadius: "8px" }}
    >
      <View id="00030" viewKey="View 1">
        <Statistic
          id="activeOrgsKpi2"
          currency="USD"
          decimalPlaces={0}
          label="Active organizations"
          labelCaption="Currently active organizations"
          positiveTrend="{{ self.value >= 0 }}"
          secondaryCurrency="USD"
          secondaryDecimalPlaces={0}
          secondaryPositiveTrend="{{ self.secondaryValue >= 0 }}"
          secondaryShowSeparators={true}
          secondaryValue=""
          showSeparators={true}
          suffix=" orgs"
          value="{{ activeOrganizationsTransformer.value }}"
        />
        <Icon
          id="activeOrgsIcon2"
          horizontalAlign="right"
          icon="bold/shopping-building"
          style={{ color: "highlight", background: "#3e63dd1a" }}
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="totalDonorsCard2"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{ border: "surfacePrimaryBorder", borderRadius: "8px" }}
    >
      <View id="00030" viewKey="View 1">
        <Statistic
          id="totalDonorsKpi2"
          currency="USD"
          decimalPlaces={0}
          label="Total Donors"
          labelCaption="Current total donors"
          positiveTrend="{{ self.value >= 0 }}"
          secondaryCurrency="USD"
          secondaryDecimalPlaces={0}
          secondaryPositiveTrend="{{ self.secondaryValue >= 0 }}"
          secondaryShowSeparators={true}
          secondaryValue=""
          showSeparators={true}
          suffix=" donors"
          value="{{ totalDonorsTransformer.value }}"
        />
        <Icon
          id="totalDonorsIcon2"
          horizontalAlign="right"
          icon="bold/interface-user-multiple"
          style={{ color: "success", background: "#3e63dd1a" }}
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="totalDonationsCard2"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{ border: "surfacePrimaryBorder", borderRadius: "8px" }}
    >
      <View id="00030" viewKey="View 1">
        <Statistic
          id="totalDonationsKpi2"
          currency="USD"
          decimalPlaces={2}
          formattingStyle="currency"
          label="Total Donations"
          labelCaption="All-time total"
          padDecimal={true}
          positiveTrend="{{ self.value >= 0 }}"
          secondaryCurrency="USD"
          secondaryDecimalPlaces={1}
          secondaryFormattingStyle="percent"
          secondaryPositiveTrend="{{ self.secondaryValue >= 0 }}"
          secondaryShowSeparators={true}
          secondaryValue=""
          showSeparators={true}
          value="{{ totalDonationsTransformer.value }}"
        />
        <Icon
          id="totalDonationsIcon2"
          horizontalAlign="right"
          icon="bold/money-currency-dollar"
          style={{ color: "primary", background: "#3e63dd1a" }}
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="donationTrendsCard2"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{ border: "surfacePrimaryBorder", borderRadius: "8px" }}
    >
      <View id="00030" viewKey="View 1">
        <Text
          id="donationTrendsTitle2"
          value="#### Donation Trends"
          verticalAlign="center"
        />
        <Chart
          id="donationTrendsChart2"
          barMode="group"
          barOrientation=""
          chartType="line"
          clearOnEmptyData={true}
          legendPosition="none"
          selectedPoints="[]"
          stackedBarTotalsDataLabelPosition="none"
          title="Donation trends over time"
          xAxisLineWidth={1}
          xAxisRangeMax=""
          xAxisRangeMin=""
          xAxisShowLine={true}
          xAxisShowTickLabels={true}
          xAxisTickFormatMode="gui"
          xAxisTitle="Date"
          xAxisTitleStandoff={20}
          yAxis2LineWidth={1}
          yAxis2RangeMax=""
          yAxis2RangeMin=""
          yAxis2ShowTickLabels={true}
          yAxis2TickFormatMode="gui"
          yAxis2TitleStandoff={20}
          yAxisGrid={true}
          yAxisLineWidth={1}
          yAxisRangeMax=""
          yAxisRangeMin=""
          yAxisShowTickLabels={true}
          yAxisTickFormatMode="gui"
          yAxisTitle="Total donations"
          yAxisTitleStandoff={20}
        >
          <Series
            id="0"
            aggregationType="none"
            colorArray={{ array: [] }}
            colorArrayDropDown={{ array: [] }}
            colorInputMode="gradientColorArray"
            connectorLineColor="#000000"
            dataLabelPosition="none"
            datasourceMode="manual"
            decreasingBorderColor="#000000"
            decreasingColor="#000000"
            filteredGroupsMode="source"
            gradientColorArray={{ array: [{ array: [] }] }}
            groupBy={{ array: [] }}
            groupByDropdownType="manual"
            groupByStyles={{}}
            hidden={false}
            hiddenMode="source"
            hoverTemplateArray={{ array: [] }}
            hoverTemplateMode="manual"
            increasingBorderColor="#000000"
            increasingColor="#000000"
            lineColor="{{ theme.automatic[0] }}"
            lineDash="solid"
            lineShape="linear"
            lineUnderFillMode="none"
            lineWidth={2}
            markerBorderColor="#ffffff"
            markerBorderWidth={1}
            markerColor="{{ theme.automatic[0] }}"
            markerSize={6}
            markerSymbol="circle"
            name="Total donations"
            showMarkers={false}
            textTemplateMode="manual"
            type="line"
            waterfallBase={0}
            waterfallMeasures={{ array: [] }}
            waterfallMeasuresMode="source"
            xData="{{ donationTrendsTransformer.value.map(d => d.date) }}"
            xDataMode="manual"
            yAxis="y"
            yData="{{ donationTrendsTransformer.value.map(d => d.total) }}"
            yDataMode="manual"
            zData="[1, 2, 3, 4, 5]"
            zDataMode="manual"
          />
        </Chart>
      </View>
    </Container>
    <Container
      id="orgDistributionCard2"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{ border: "surfacePrimaryBorder", borderRadius: "8px" }}
    >
      <View id="00030" viewKey="View 1">
        <Text
          id="orgDistributionTitle2"
          value="#### Distribution by Organization"
          verticalAlign="center"
        />
        <Chart
          id="orgDistributionChart2"
          chartType="pie"
          clearOnEmptyData={true}
          colorArray={[
            "#11B5AE",
            "#4046CA",
            "#F68512",
            "#DE3C82",
            "#7E84FA",
            "#72E06A",
          ]}
          colorArrayDropDown={[
            "#11B5AE",
            "#4046CA",
            "#F68512",
            "#DE3C82",
            "#7E84FA",
            "#72E06A",
          ]}
          colorInputMode="colorArrayDropDown"
          datasource=""
          datasourceMode="source"
          gradientColorArray={[
            ["0.0", "{{ theme.canvas }}"],
            ["1.0", "{{ theme.primary }}"],
          ]}
          hoverTemplate="%{label}<br>%{value}<br>%{percent}<extra></extra>"
          hoverTemplateMode="source"
          labelData="{{ orgDistributionTransformer.value.map(r => r.org) }}"
          legendPosition="none"
          lineColor="{{ theme.surfacePrimary }}"
          lineWidth={2}
          pieDataHole={0.4}
          selectedPoints="[]"
          textTemplateMode="source"
          textTemplatePosition="outside"
          title="Donations by organization"
          valueData="{{ orgDistributionTransformer.value.map(r => r.total) }}"
        />
      </View>
    </Container>
    <Container
      id="organizationsHeaderContainer2"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{ border: "surfacePrimaryBorder", borderRadius: "8px" }}
    >
      <View id="00030" viewKey="View 1">
        <Text
          id="organizationsTableHeader2"
          value="#### Organizations"
          verticalAlign="center"
        />
      </View>
    </Container>
    <Table
      id="organizationsTable2"
      cellSelection="none"
      clearChangesetOnSave={true}
      data="{{ filteredOrganizationsTransformer.value }}"
      defaultSelectedRow={{ mode: "none", indexType: "display", index: 0 }}
      emptyMessage="No rows found"
      enableSaveActions={true}
      overflowType="pagination"
      primaryKeyColumnId="56a23"
      rowHeight="medium"
      showBorder={true}
      showFooter={true}
      showHeader={true}
      style={{ rowSeparator: "surfacePrimaryBorder" }}
      templatePageSize={10}
      toolbarPosition="bottom"
    >
      <Column
        id="56a23"
        alignment="right"
        editableOptions={{ showStepper: true }}
        format="decimal"
        formatOptions={{ showSeparators: false }}
        groupAggregationMode="none"
        key="id"
        label="ID"
        position="center"
        referenceId="id"
        size={72}
        summaryAggregationMode="none"
      />
      <Column
        id="a16f7"
        alignment="left"
        cellTooltipMode="overflow"
        editableOptions={{ spellCheck: false }}
        format="string"
        groupAggregationMode="none"
        key="name"
        label="Organization"
        position="center"
        referenceId="name"
        size={220}
        summaryAggregationMode="none"
      />
      <Column
        id="f832b"
        alignment="left"
        cellTooltipMode="overflow"
        editableOptions={{ spellCheck: false }}
        format="string"
        groupAggregationMode="none"
        key="slug"
        label="Slug"
        position="center"
        referenceId="slug"
        size={180}
        summaryAggregationMode="none"
      />
      <Column
        id="363a2"
        alignment="left"
        cellTooltipMode="overflow"
        format="email"
        groupAggregationMode="none"
        key="email"
        label="Email"
        position="center"
        referenceId="email"
        size={220}
        summaryAggregationMode="none"
      />
      <Column
        id="b6f49"
        alignment="left"
        format="tag"
        formatOptions={{ automaticColors: true }}
        groupAggregationMode="none"
        key="type"
        label="Type"
        position="center"
        referenceId="type"
        size={120}
        summaryAggregationMode="none"
      />
      <Column
        id="0eb36"
        alignment="left"
        format="tag"
        formatOptions={{ automaticColors: true }}
        groupAggregationMode="none"
        key="status"
        label="Status"
        position="center"
        referenceId="status"
        size={120}
        summaryAggregationMode="none"
      />
      <Column
        id="d9090"
        alignment="right"
        editableOptions={{ showStepper: true }}
        format="currency"
        formatOptions={{
          showSeparators: true,
          decimalPlaces: 0,
          currency: "USD",
          currencySign: "standard",
          currencyDisplay: "symbol",
        }}
        groupAggregationMode="none"
        key="totalDonations"
        label="Total donations"
        position="center"
        referenceId="totalDonations"
        size={140}
        summaryAggregationMode="none"
      />
      <Column
        id="813b1"
        alignment="left"
        format="date"
        formatOptions={{ dateFormat: "yyyy-MM-dd" }}
        groupAggregationMode="none"
        key="createdAt"
        label="Created at"
        position="center"
        referenceId="createdAt"
        size={120}
        summaryAggregationMode="none"
      />
      <ToolbarButton
        id="1a"
        icon="bold/interface-text-formatting-filter-2"
        label="Filter"
        type="filter"
      />
      <ToolbarButton
        id="3c"
        icon="bold/interface-download-button-2"
        label="Download"
        type="custom"
      >
        <Event
          id="35c58564"
          event="clickToolbar"
          method="exportData"
          pluginId="organizationsTable2"
          type="widget"
          waitMs="0"
          waitType="debounce"
        />
      </ToolbarButton>
      <ToolbarButton
        id="4d"
        icon="bold/interface-arrows-round-left"
        label="Refresh"
        type="custom"
      >
        <Event
          id="eedc7d8a"
          event="clickToolbar"
          method="refresh"
          pluginId="organizationsTable2"
          type="widget"
          waitMs="0"
          waitType="debounce"
        />
      </ToolbarButton>
    </Table>
    <Container
      id="donationsHeaderContainer2"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{ border: "surfacePrimaryBorder", borderRadius: "8px" }}
    >
      <View id="00030" viewKey="View 1">
        <Text
          id="donationsTableHeader2"
          value="#### Recent Donations"
          verticalAlign="center"
        />
      </View>
    </Container>
    <Table
      id="donationsTable2"
      actionsOverflowPosition={1}
      cellSelection="none"
      clearChangesetOnSave={true}
      data="{{ filteredDonationsTransformer.value }}"
      defaultSelectedRow={{ mode: "none", indexType: "display", index: 0 }}
      emptyMessage="No rows found"
      enableSaveActions={true}
      primaryKeyColumnId="60285"
      rowHeight="medium"
      showBorder={true}
      showFooter={true}
      showHeader={true}
      style={{ rowSeparator: "surfacePrimaryBorder" }}
      toolbarPosition="bottom"
    >
      <Column
        id="43ea0"
        alignment="left"
        format="date"
        formatOptions={{ dateFormat: "yyyy-MM-dd" }}
        groupAggregationMode="none"
        key="createdAt"
        label="Date"
        position="center"
        referenceId="createdAt"
        size={110}
        summaryAggregationMode="none"
      />
      <Column
        id="467c8"
        alignment="left"
        cellTooltipMode="overflow"
        editableOptions={{ spellCheck: false }}
        format="string"
        groupAggregationMode="none"
        key="endowment"
        label="Endowment"
        position="center"
        referenceId="endowment"
        size={180}
        summaryAggregationMode="none"
      />
      <Column
        id="62fa5"
        alignment="left"
        cellTooltipMode="overflow"
        editableOptions={{ spellCheck: false }}
        format="string"
        groupAggregationMode="none"
        key="campaign"
        label="Campaign"
        position="center"
        referenceId="campaign"
        size={180}
        summaryAggregationMode="none"
      />
      <Column
        id="8dca8"
        alignment="left"
        format="tag"
        formatOptions={{ automaticColors: true }}
        groupAggregationMode="none"
        key="status"
        label="Status"
        position="center"
        referenceId="status"
        size={120}
        summaryAggregationMode="none"
      />
      <Column
        id="1f3b4"
        alignment="left"
        format="tag"
        formatOptions={{ automaticColors: true }}
        groupAggregationMode="none"
        key="currency"
        label="Currency"
        position="center"
        referenceId="currency"
        size={90}
        summaryAggregationMode="none"
      />
      <Column
        id="528d2"
        alignment="right"
        editableOptions={{ showStepper: true }}
        format="decimal"
        formatOptions={{ showSeparators: true, notation: "standard" }}
        groupAggregationMode="none"
        key="amount"
        label="Amount"
        position="center"
        referenceId="amount"
        size={120}
        summaryAggregationMode="none"
      />
      <Column
        id="5ea9d"
        alignment="left"
        cellTooltipMode="overflow"
        format="email"
        groupAggregationMode="none"
        key="donorEmail"
        label="Email"
        position="center"
        referenceId="donorEmail"
        size={220}
        summaryAggregationMode="none"
      />
      <Column
        id="86a29"
        alignment="left"
        cellTooltipMode="overflow"
        editableOptions={{ spellCheck: false }}
        format="string"
        groupAggregationMode="none"
        key="donorName"
        label="Donor"
        position="center"
        referenceId="donorName"
        size={180}
        summaryAggregationMode="none"
      />
      <Column
        id="46f79"
        alignment="left"
        cellTooltipMode="overflow"
        editableOptions={{ spellCheck: false }}
        format="string"
        groupAggregationMode="none"
        key="orgName"
        label="Organization"
        position="center"
        referenceId="orgName"
        size={200}
        summaryAggregationMode="none"
      />
      <Column
        id="60285"
        alignment="right"
        editableOptions={{ showStepper: true }}
        format="decimal"
        formatOptions={{ showSeparators: true }}
        groupAggregationMode="none"
        key="id"
        label="Donation ID"
        position="center"
        referenceId="donationId"
        size={80}
        summaryAggregationMode="none"
        tooltip="Unique ID for this donation"
      />
      <Action id="77243" icon="line/interface-edit-view" label="View">
        <Event
          id="dd9bd734"
          event="clickAction"
          method="run"
          params={{
            map: {
              src: "donationsData.setValue(donationsTable2.selectedSourceRow ?? {});\nmodalFrame2.show();",
            },
          }}
          pluginId=""
          type="script"
          waitMs="0"
          waitType="debounce"
        />
      </Action>
      <ToolbarButton
        id="1a"
        icon="bold/interface-text-formatting-filter-2"
        label="Filter"
        type="filter"
      />
      <ToolbarButton
        id="3c"
        icon="bold/interface-download-button-2"
        label="Download"
        type="custom"
      >
        <Event
          id="ec02a483"
          event="clickToolbar"
          method="exportData"
          pluginId="donationsTable2"
          type="widget"
          waitMs="0"
          waitType="debounce"
        />
      </ToolbarButton>
      <ToolbarButton
        id="4d"
        icon="bold/interface-arrows-round-left"
        label="Refresh"
        type="custom"
      >
        <Event
          id="ecdaf68e"
          event="clickToolbar"
          method="refresh"
          pluginId="donationsTable2"
          type="widget"
          waitMs="0"
          waitType="debounce"
        />
      </ToolbarButton>
    </Table>
  </Frame>
</Screen>
