import { Database, Statement } from 'better-sqlite3';
import { Molecule } from 'openchemlib';
import calculateMoleculeInfo from '../src/calculate/calculateMoleculeInfo';

import { InternalMoleculeInfo } from '../src/InternalMoleculeInfo';
import getDB from '../src/db/getDB';

let stmt: Statement;

/*
 Just a quick test to find out it sqlite3 is fast
 Conclusion is that in a transaction it is. Otherwise not !
 In a transaction we can add nearly 100 thousands entries per second !!!
*/

function save(info: InternalMoleculeInfo, db: Database) {
  if (!stmt) {
    stmt = db.prepare(
      'INSERT INTO molecules VALUES (@idCode, @mf, @em, @mw, @noStereoID, @noStereoTautomerID, @logS, @logP, @acceptorCount, @donorCount, @rotatableBondCount, @stereoCenterCount, @polarSurfaceArea, @ssIndex)',
    );
  }
  try {

    const insertMany = db.transaction((entries) => {
      for (const entry of entries) {
        stmt.run(entry)
      }
      console.log(entries[123])
      console.log(entries.length)
    });

    const entries = []
    const idCode = info.idCode
    const ssIndex = info.ssIndex
    for (let i = 0; i < 1000000; i++) {
      const copy = JSON.parse(JSON.stringify(info))
      copy.idCode = idCode + '_' + i + '_' + Math.random()
      copy.ssIndex = ssIndex
      entries.push(copy)
    }
    insertMany(entries);

  } catch (e) {
    console.log(e);
    console.log('Existing idCode: ', info.idCode)
  }
}

async function quickTest() {
  const db = getDB();
  const molecule = Molecule.fromSmiles('CCCC')
  const info = calculateMoleculeInfo(molecule)
  console.time('saveInDB')
  const idCode = info.idCode
  for (let i = 0; i < 1; i++) {
    info.idCode = idCode + '_' + i + '_' + Math.random()
    save(info, db)
  }
  console.timeEnd('saveInDB')

}

quickTest()