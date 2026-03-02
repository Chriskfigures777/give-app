const donations = {{ donationsData.value }} || [];
const byDate = {};

for (const d of donations) {
  const day = d.createdAt?.slice(0, 10);
  if (!day) continue;
  byDate[day] = (byDate[day] || 0) + (d.amount || 0);
}

return Object.entries(byDate).map(([date, total]) => ({ date, total }));