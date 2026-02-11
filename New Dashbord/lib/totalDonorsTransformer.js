const donations = {{ donationsData.value }} || [];
const emails = new Set(donations.map((d) => d.donorEmail).filter(Boolean));
return emails.size;