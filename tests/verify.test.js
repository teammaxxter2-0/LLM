
// This file is a test suite for the verify.js file. It tests the verify function.
const fs = require('fs');
const path = require('path');
const { OpenAiManager } = require('../assistant.js');
require('dotenv').config();

const manager = new OpenAiManager();
jest.setTimeout(60000);

function loadJson(filePath) {
    const fullPath = path.resolve(__dirname, filePath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

async function reValidate(data) {
    // Checks if returned data is valid with itself.
    const responseValue = await manager.verify(data);
    expect(JSON.parse(data)["materiaalInformatie"]).toStrictEqual(JSON.parse(responseValue)["materiaalInformatie"]);
}

test('validates valid name valid data', async () => {
    manager.dummyData = fs.readFileSync('./instructions/DB.json', 'utf8');
    const document = loadJson('./testData/valid_name_valid_data.json');
    const data = JSON.stringify(document);
    const responseValue = await manager.verify(data);
    expect(JSON.parse(responseValue)["materiaalInformatie"]).toStrictEqual(document["materiaalInformatie"]);
    await reValidate(responseValue);
});

test('validates valid name invalid data', async () => {
    manager.dummyData = fs.readFileSync('./instructions/DB.json', 'utf8');
    const document = loadJson('./testData/valid_name_invalid_data.json');
    const data = JSON.stringify(document);
    const responseValue = await manager.verify(data);
    const resData = JSON.parse(responseValue)["materiaalInformatie"]
    expect(resData).not.toEqual(document["materiaalInformatie"]);
    expect(resData["kraangat_prijs"]).toEqual(10.7);
    expect(resData["offerte_prijs_totaal"]).toEqual(3833.5);
    expect(resData["randafwerking"]).toEqual(false);
    expect(resData["randafwerking_m"]).toEqual(0);
    expect(resData["spatrand_prijs_totaal"]).toEqual(35);
    await reValidate(responseValue);
});

test('validates invalid name valid data', async () => {
    manager.dummyData = fs.readFileSync('./instructions/DB.json', 'utf8');
    const document = loadJson('./testData/invalid_name_valid_data.json');
    const data = JSON.stringify(document);
    const responseValue = await manager.verify(data);
    const resData = JSON.parse(responseValue)["materiaalInformatie"]
    expect(resData).not.toEqual(document["materiaalInformatie"]);
    expect(document["materiaalInformatie"]["name"]).toEqual("Marble White");
    expect(resData["name"]).toEqual('Noble Desiree Grey Matt');
    await reValidate(responseValue);
});

test('validates invalid name invalid data', async () => {
    manager.dummyData = fs.readFileSync('./instructions/DB.json', 'utf8');
    const document = loadJson('./testData/invalid_name_invalid_data.json');
    const data = JSON.stringify(document);
    const responseValue = await manager.verify(data);
    const resData = JSON.parse(responseValue)["materiaalInformatie"]
    expect(resData).not.toEqual(document["materiaalInformatie"]);
    expect(resData["name"]).toEqual("");
    expect(resData["prijs_per_m2"]).toEqual(0);
    expect(resData["offerte_prijs_totaal"]).toEqual(0);
    expect(resData["spoelbak"]).toEqual(false);
    await reValidate(responseValue);
});

test('validates valid name valid data with db change', async () => {
    manager.dummyData = fs.readFileSync('./instructions/DB.json', 'utf8');
    const document = loadJson('./testData/valid_name_valid_data.json');
    const data = JSON.stringify(document);
    let responseValue = await manager.verify(data);
    expect(JSON.parse(responseValue)["materiaalInformatie"]).toStrictEqual(document["materiaalInformatie"]);
    const oldData = JSON.parse(responseValue)["materiaalInformatie"];
    manager.dummyData = fs.readFileSync('./tests/testData/updatedDB.json', 'utf8');
    responseValue = await manager.verify(data);
    const resData = JSON.parse(responseValue)["materiaalInformatie"]

    expect(document["materiaalInformatie"]["prijs_per_m2"]).toEqual(247.52);
    expect(oldData["prijs_per_m2"]).toEqual(247.52);
    expect(resData["prijs_per_m2"]).toEqual(300);
    expect(document["materiaalInformatie"]["offerte_prijs_totaal"]).toEqual(3916);
    expect(oldData["offerte_prijs_totaal"]).toEqual(3916);
    expect(resData["offerte_prijs_totaal"]).toEqual(4169.4);

    await reValidate(responseValue);
});