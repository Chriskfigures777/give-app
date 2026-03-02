const donations = {{ donationsData.value }} || [];
const byOrg = {};

for (const d of donations) {
  const key = d.orgName || `Org ${d.orgId}`;
  byOrg[key] = (byOrg[key] || 0) + (d.amount || 0);
}

return Object.entries(byOrg).map(([org, total]) => ({ org, total }));