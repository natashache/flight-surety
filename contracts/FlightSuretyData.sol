pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct airlineObj {
        bool isRegistered;
        uint256 balance;
    }

    mapping(address => bool) private authorizedCallers;
    mapping(address => airlineObj) private airlines;
    mapping(address => bool) private operatingAirlines;
    address[] operatingAirlinesList;


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address firstAirline
                                )
                                public
    {
        contractOwner = msg.sender;
        airlines[firstAirline] = airlineObj({
            isRegistered: true,
            balance: 0
        }); // autho register the first airline
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsAuthorizedCaller() {
        require(isAuthorizedCaller(msg.sender), "Caller is not authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }

    function isAirline(address airline) public view returns (bool)
    {
        return airlines[airline].isRegistered;
    }

    function isOperatingAirline(address airline) public view returns (bool)
    {
        return operatingAirlines[airline];
        // return true;
    }

    function authorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedCallers[contractAddress] = true;
    }

    function deauthorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        delete authorizedCallers[contractAddress];
    }

    function isAuthorizedCaller(address caller) returns (bool) {
       return authorizedCallers[caller];
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */

    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            // requireIsOperational
                            requireContractOwner
    {
        operational = mode;
    }

    function getAccountBalance (address airline) external view returns(uint256) {
        return airlines[airline].balance;
    }

    function getOperatingAirlines () external view returns(address[]) {
        return operatingAirlinesList;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
                            (
                                address newAirline
                            )
                            external
                            requireIsAuthorizedCaller
    {
        airlines[newAirline] = airlineObj({
            isRegistered: true,
            balance: 0
        });
    }

    function setAirlineOperatingStatus
                            (
                                address airline,
                                bool mode
                            )
                            requireIsOperational
    {
        operatingAirlines[airline] = mode;
        operatingAirlinesList.push(airline);
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                                address account,
                                uint256 amount
                            )
                            public
                            payable
                            requireIsOperational
    {
        airlines[account].balance = airlines[account].balance.add(amount);


        if(isAirline(account) && airlines[account].balance >= 10 ether) {
            operatingAirlines[account] = true;
            operatingAirlinesList.push(account);
        }

    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
                            external
                            payable
    {
        fund(contractOwner, msg.value);
    }


}

