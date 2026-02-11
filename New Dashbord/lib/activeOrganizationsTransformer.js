const orgs = {{ organizationsData.value }} || [];
return orgs.filter((o) => o.status === 'active').length;