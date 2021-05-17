import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts(async (error, accts) => {

            this.owner = accts[0];

            let counter = 10;
            let self = this;
            // while(this.airlines.length < 5) {
            //     this.airlines.push(accts[counter++]);
            // }

            // fetch the airlines
            this.airlines = await this.flightSuretyApp.methods.getOperatingAirlines().call({ from: self.owner});

            // create the passengers
            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            // create the filights
            let flightNumbers = ['FL101', 'FL201', 'FL301', 'FL401', 'FL501'];
            flightNumbers.forEach((item, index) => {
                this.flights.push({
                    flight: item,
                    airline: self.airlines[index],
                    timestamp: randomDate(new Date(), new Date(Date.now() + 86400000)), // one day interval
                })
            });

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}