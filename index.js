let arg1 = process.argv[2];
let arg2 = process.argv[3];
let arg3 = process.argv[4];

const neo4j = require('neo4j-driver')

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'password'))
const session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ })


if (arg1.toLowerCase() == "directed_by") {
    universalFunc(1, arg2, arg3)
} else if (arg1.toLowerCase() == 'worked_with') {
    universalFunc(2, arg2, arg3)
} else if (arg1.toLowerCase() == 'actors_count') {
    universalFunc(3);
} else {
    console.log(`Доступные команды:
    1. directed_by FIRST_NAME LAST_NAME (ex: directed_by Andy Wachowski)
    2. worked_with FIRST_NAME LAST_NAME (ex: worked_with Tom Hanks)
    3. actors_count`)
}

function universalFunc(num, fname='', lname='') {
    // готовим запрос
    sql = num == 1 ? `MATCH (mv:Movie)-[:DIRECTED]-(p:Person {name: "${fname} ${lname}"}) return mv;` 
                    : (num == 2 ? `MATCH (pers:Person {name:"${fname} ${lname}"})-[*]->(m)<-[*]-(coWorker) WHERE pers <> coWorker RETURN DISTINCT coWorker.name;` 
                    : `MATCH (pers:Person)-[:ACTED_IN]->(m:Movie) RETURN DISTINCT m.title, COUNT(pers.name);`)
    const readTxResultPromise = session.readTransaction(txc => {
        let result = txc.run(sql)
        return result
    })
    // обработаем результат
    readTxResultPromise
    .then(result => {
        result.records.forEach( (el) => {
            if (num == 1)
                console.log(el._fields[0]['properties']['title'])
            else if (num == 2)
                console.log(el._fields)
            else
                console.log(el._fields[0]+':',  el._fields[1]['low'])
        })
        if (result.records.length == 0) {
            console.log('Нет результатов. Убедитесь, что данные введены верно.')
        }
    })
    .catch(error => {
        console.log(error)
    })
    .then(() => {
        session.close()
        driver.close()
    })
}
