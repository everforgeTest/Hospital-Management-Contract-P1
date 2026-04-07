const { assertSuccessResponse, assertEqual } = require('../test-utils');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function HospitalTest(client) {
  // Create patient
  const createPayload = { Service: 'Patient', Action: 'Create', data: { Name: 'Alice', DOB: '1990-05-14', Gender: 'F', Contact: 'alice@example.com' } };
  await client.submitContractInput(Buffer.from(JSON.stringify(createPayload)));
  await sleep(1000);

  // List patients via read request
  const listPayload = { Service: 'Patient', Action: 'List' };
  const listRespRaw = await client.submitContractReadRequest(JSON.stringify(listPayload));
  const listResp = JSON.parse(listRespRaw.toString());
  assertSuccessResponse(listResp, 'List patients');
  const created = listResp.success.find(p => p.Name === 'Alice');
  if (!created) throw new Error('Created patient not found');

  // Update patient
  const updatePayload = { Service: 'Patient', Action: 'Update', data: { Id: created.Id, Contact: 'alice+upd@example.com' } };
  await client.submitContractInput(Buffer.from(JSON.stringify(updatePayload)));
  await sleep(1000);

  // GetById
  const getPayload = { Service: 'Patient', Action: 'GetById', data: { Id: created.Id } };
  const getRespRaw = await client.submitContractReadRequest(JSON.stringify(getPayload));
  const getResp = JSON.parse(getRespRaw.toString());
  assertSuccessResponse(getResp, 'Get patient');
  assertEqual(getResp.success.Contact, 'alice+upd@example.com', 'Patient contact updated');
}

module.exports = HospitalTest;
