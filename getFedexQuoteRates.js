import { LightningElement, api, track, wire } from 'lwc';
import getRatesFedexAPI from '@salesforce/apex/Fedex_GetRatesController.getRatesFedexAPI';
import loadWrapper from '@salesforce/apex/Fedex_GetRatesController.loadWrapper';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class GetFedexQuoteRates extends LightningElement {
    @api rates;
    @api isProcessing;
    @track value='CONTACT_FEDEX_TO_SCHEDULE';
    @api message;
    @api ratesResponse={};
    get showDeletebtn() {
        return this.requestedPackageLineItems.length >1 ;
    }
    get options() {
        return [
            { label: 'CONTACT_FEDEX_TO_SCHEDULE', value: 'CONTACT_FEDEX_TO_SCHEDULE' },
            { label: 'DROPOFF_AT_FEDEX_LOCATION', value: 'DROPOFF_AT_FEDEX_LOCATION' },
            { label: 'USE_SCHEDULED_PICKUP', value: 'USE_SCHEDULED_PICKUP' },
        ];
    }
    @track shippingaddress = {};
    @track recepientaddress = {};
    @track shipper = {};
    @track requestedPackageLineItems = [];
    @wire(loadWrapper)
    loadWrapperPayload({ error, data }) {
        if (data) {
            this.rates = JSON.parse(data);
            this.shippingaddress = this.rates.requestedShipment.shipper.address;
            this.recepientaddress = this.rates.requestedShipment.recipient.address;
            this.requestedPackageLineItems = this.rates.requestedShipment.requestedPackageLineItems;
            this.rates.requestedShipment.pickupType = this.value;
        } else if (error) {

        }
    }

    getFedexAPIRates(){
        this.isProcessing = true;
        getRatesFedexAPI({ ratesPayload : JSON.stringify(this.rates) })
        .then((result) => {
            this.isProcessing = false;
            this.message = 'Fetched Result';
            this.variant = 'success';
            if(result && JSON.parse(result).errors){
                this.message =  JSON.parse(result).errors[0].message;
                this.variant = 'error';
            }else if(result && JSON.parse(result).output){
                this.ratesResponse = JSON.parse(result).output.rateReplyDetails;
                this.isProcessing = false;
            }           
            this.showToast();
        })
        .catch((error) => {
            this.message = error.message;
            this.variant = 'error';
            this.showToast();
            this.isProcessing = false;
        });
    }

    showToast() {
        const event = new ShowToastEvent({
            title: 'Status',
            message: this.message,
            variant: this.variant
                
        });
        this.dispatchEvent(event);
    }

    handleChange(event) {
        this.value = event.detail.value;
        this.rates.requestedShipment.pickupType = this.value;
    }

    shippingAddressHandler(event) {
        if (event.currentTarget.label === 'State Code') {
            this.shippingaddress.stateOrProvinceCode = event.currentTarget.value;
        } else if (event.currentTarget.label === 'Postal Code') {
            this.shippingaddress.postalCode = event.currentTarget.value;
        } else if (event.currentTarget.label === 'Country Code') {
            this.shippingaddress.countryCode = event.currentTarget.value;
        }
        this.rates.requestedShipment.shipper.address = this.shippingaddress;
    }
    recepientAddressHandler(event) {
        if (event.currentTarget.label === 'State Code') {
            this.recepientaddress.stateOrProvinceCode = event.currentTarget.value;
        } else if (event.currentTarget.label === 'Postal Code') {
            this.recepientaddress.postalCode = event.currentTarget.value;
        } else if (event.currentTarget.label === 'Country Code') {
            this.recepientaddress.countryCode = event.currentTarget.value;
        }
        this.rates.requestedShipment.recipient.address = this.recepientaddress;
    }

    onPackageLineItemChange(event) {
       let name = event.currentTarget.getAttribute('data-name');
       let index = event.currentTarget.getAttribute('data-index');
       if(name === 'value'){
        this.requestedPackageLineItems[index].weight.value = event.currentTarget.value;
       }else if(name === 'units'){
        this.requestedPackageLineItems[index].weight.units = event.currentTarget.value;
       }
       this.rates.requestedShipment.requestedPackageLineItems = this.requestedPackageLineItems;
    }

    handleDelete(event) {
        let index = event.target.dataset.index;
        this.requestedPackageLineItems.splice(index, 1);
    }

    handleCreate(event) {
        let index = event.target.dataset.index;
        let newfreight = { "weight": { "units": "", "value": "" } };
        this.requestedPackageLineItems.splice(index + 1, 0, newfreight);
    }
}