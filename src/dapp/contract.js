import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

function randomDate(start, end) {
    let date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.getTime();
}

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = {};
        this.flights = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts(async (error, accts) => {

            this.owner = accts[0];
            let self = this;
            // while(this.airlines.length < 5) {
            //     this.airlines.push(accts[counter++]);
            // }

            // register 5 airlines on start
            // this.registerAirline(this.owner);
            this.fundAirline(this.owner);
            console.log('candidate airlines: ', accts.slice(1,5));
            this.registerAndFundAirlines(accts.slice(1,5));

            // fetch the airlines
            this.airlines = await this.flightSuretyApp.methods.getOperatingAirlines().call({ from: self.owner});
            console.log('operating airlines: ', this.airlines);

            // create the passengers
            let counter = 10;
            while(counter < 15) {
                this.passengers[accts[counter]] = {
                    insurancePremiumBalance: 0,
                    payoutBalance: 0,
                }; // each passenger starts w/ zero balance
                counter++;
            }
            console.log('passengers: ', this.passengers);

            // create the filights
            let flightNumbers = ['FL101', 'FL201', 'FL301', 'FL401', 'FL501'];
            flightNumbers.forEach((item, index) => {
                this.flights.push({
                    flight: item,
                    airline: self.airlines[index],
                    timestamp: randomDate(new Date(), new Date(Date.now() + 86400000)), // one day interval
                })
            });
            console.log(this.flights);

            callback();
        });
    }

    async registerAndFundAirlines(airlines) {
        let self = this;
        for(let i = 0; i < airlines.length; i++) {
            self.registerAirline(airlines[i], self.owner);
            self.fundAirline(airlines[i]);
        }
    }

    async registerAirline(airline, owner) {
        let self = this;
        await self.flightSuretyApp.methods.registerAirline(airline)
            .send({ from: owner, gas: 1000000 });
    }

    async fundAirline(airline) {
        let self = this;
        // let amount = self.web3.utils.toWei(10, "ether").toString();
        let amount = 10000000000000000000; // 10 ether
        await self.flightSuretyApp.methods.fundAirline(airline)
            .send({ from: airline, value: amount, gas: 1000000 }, (err, result) => {
                if(err) {
                    console.log('error funding airline: ', err);
                }
            });

        // await self.flightSuretyApp.methods.fundAirline(airline, {from: airline, value: amount});

    }

    async buyInsurance(passenger, amount, flight, callback) {
        let self  = this;
        let insurancePremium = self.web3.utils.toWei(amount).toString();
        // let insurancePremium = amount * 1000000000000000000;
        console.log('insurancePremium: ', insurancePremium);
        if(self.passengers[passenger]) {
            self.passengers[passenger].insurancePremiumBalance += insurancePremium;
        } else {
            self.passengers[passenger].insurancePremiumBalance = insurancePremium;
        }

        await self.flightSuretyApp.methods.buyInsurance(flight, insurancePremium)
            .send({ from: passenger, value: insurancePremium, gas: 1000000 }, (err, result) => {
                callback(err, result);
            });
    }

    async payInsurance(passenger, callback) {
        let self  = this;
        let balance = self.passengers[passenger].payoutBalance;
        if (balance > 0) {
            await self.flightSuretyApp.methods.payoutInsuree(passenger, balance)
                .send({ from: passenger, gas: 1000000 }, (err, result) => {
                    callback(err, balance);
                });
        } else {
            console.log("You haven't bought any insurance");
        }
    }

    async getAccountBalance(passenger, callback) {
        await self.flightSuretyApp.methods.getInsureeBalance(passenger)
            .send({ from: passenger }, (err, result) => {
                console.log('payoutBalance: ', result);
                self.passengers[passenger].payoutBalance = result;
                callback(err, result);
            })
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {};
        self.flights.forEach(item => {
            if (flight == item.flight) {
                payload = item;
            }
        });

        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                console.log('result: ', result);
                callback(error, result);
            });
    }
}