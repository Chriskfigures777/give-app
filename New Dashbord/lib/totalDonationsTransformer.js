const donations = {{ donationsData.value }} || [];
return donations.reduce((sum, d) => sum + (d.amount || 0), 0);