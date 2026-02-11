<GlobalFunctions>
  <State
    id="organizationsData"
    value={
      '[{"id":1,"name":"Grace Church","slug":"grace-church","email":"admin@grace.org","type":"church","status":"active","totalDonations":25000,"createdAt":"2024-01-10"},{"id":2,"name":"Hope Nonprofit","slug":"hope-nonprofit","email":"hello@hope.org","type":"nonprofit","status":"active","totalDonations":12000,"createdAt":"2024-02-05"},{"id":3,"name":"City Outreach","slug":"city-outreach","email":"info@cityoutreach.org","type":"nonprofit","status":"inactive","totalDonations":5000,"createdAt":"2023-11-20"}]'
    }
  />
  <State
    id="donationsData"
    value={
      '[{"id":101,"orgId":1,"orgName":"Grace Church","donorName":"Alice Johnson","donorEmail":"alice@example.com","amount":100,"currency":"USD","status":"succeeded","campaign":"General Fund","endowment":"Main Endowment","createdAt":"2024-03-01"},{"id":102,"orgId":1,"orgName":"Grace Church","donorName":"Bob Smith","donorEmail":"bob@example.com","amount":250,"currency":"USD","status":"succeeded","campaign":"Building Fund","endowment":null,"createdAt":"2024-03-02"},{"id":103,"orgId":2,"orgName":"Hope Nonprofit","donorName":"Carol Lee","donorEmail":"carol@example.com","amount":50,"currency":"USD","status":"pending","campaign":"Food Program","endowment":"Community Endowment","createdAt":"2024-02-28"},{"id":104,"orgId":2,"orgName":"Hope Nonprofit","donorName":"David Kim","donorEmail":"david@example.com","amount":500,"currency":"USD","status":"succeeded","campaign":"General Fund","endowment":null,"createdAt":"2024-03-03"},{"id":105,"orgId":3,"orgName":"City Outreach","donorName":"Emma Wilson","donorEmail":"emma@example.com","amount":75,"currency":"USD","status":"failed","campaign":"Winter Shelter","endowment":null,"createdAt":"2023-12-15"}]'
    }
  />
  <State
    id="campaignsData"
    value={
      '[{"id":1,"name":"General Fund"},{"id":2,"name":"Building Fund"},{"id":3,"name":"Food Program"},{"id":4,"name":"Winter Shelter"}]'
    }
  />
  <State
    id="endowmentFundsData"
    value={
      '[{"id":1,"name":"Main Endowment"},{"id":2,"name":"Community Endowment"}]'
    }
  />
</GlobalFunctions>
