public class Fedex_GetRatesController {
    
    @AuraEnabled(cacheable=true)
    public static String loadWrapper(){
        Fedex_GetRatesController.GetRatesWrapper rateswrapper = new Fedex_GetRatesController.GetRatesWrapper();
        AccountNumber accountNumber = new AccountNumber();
        rateswrapper.accountNumber = accountNumber;
        RequestedShipment requestedShipment = new RequestedShipment();
        requestedShipment.rateRequestType = new List<String>{'ACCOUNT'};
        Shipper shipper = new Shipper();
        Address address = new Address();
        shipper.address = address;
        requestedShipment.shipper = shipper;
        Shipper recipient = new Shipper();
        recipient.address = address;
        requestedShipment.recipient = recipient;
        RequestedPackageLineItems requestedPackageLineItem = new RequestedPackageLineItems();
        Weight weight = new Weight();
        requestedPackageLineItem.weight = weight;
        requestedShipment.requestedPackageLineItems = new List<RequestedPackageLineItems>{requestedPackageLineItem};
        rateswrapper.requestedShipment = requestedShipment;
        return JSON.serialize(rateswrapper);
    }
    
    @AuraEnabled(cacheable=true)
    public static String getRatesFedexAPI(String ratesPayload){
        HttpRequest req = new HttpRequest(); 
        String Endpoint = Fedex_Credentials__mdt.getInstance('Endpoint').value__c;
        String clientSecret = Fedex_Credentials__mdt.getInstance('Client_Secret').value__c;
        String clientKey = Fedex_Credentials__mdt.getInstance('Client_Key').value__c;
        req.setEndpoint('https://apis-sandbox.fedex.com/oauth/token'); 
        req.setMethod('POST'); 
        req.setHeader('Content-Type','application/x-www-form-urlencoded');
        req.setBody('grant_type=client_credentials&client_id='+clientKey+'&client_secret='+clientSecret);
        Http http = new Http(); 
        HTTPResponse res = http.send(req);  
        String body = res.getBody();
        system.debug('body::'+body);
        FedexWrapper Wrapper = (FedexWrapper)System.JSON.deserialize(res.getBody(), FedexWrapper.class);
        String accesscode = Wrapper.access_token;
        
        HttpRequest reqst = new HttpRequest();
        reqst.setEndpoint('https://apis-sandbox.fedex.com/rate/v1/rates/quotes');
        reqst.setMethod('POST'); 
        reqst.setHeader('Content-Type','application/json');
        reqst.setHeader('Authorization','Bearer '+accesscode);
        reqst.setBody(ratesPayload);
        Http http1 = new Http(); 
        HTTPResponse res1;
        res1 = http1.send(reqst);  
        String body1 = res1.getBody();
        system.debug('body::'+body1); 
        return body1;
    }
    public class FedexWrapper{
        public string access_token; 
    }
    
    public class GetRatesWrapper {
        @AuraEnabled public AccountNumber accountNumber ;
        @AuraEnabled public RequestedShipment requestedShipment ;
    }
    public class Address {
        @AuraEnabled public String stateOrProvinceCode;
        @AuraEnabled public Integer postalCode;
        @AuraEnabled public String countryCode;
    }
    
    public class Shipper {
        @AuraEnabled public Address address;
    }
    
    public class RequestedPackageLineItems {
        @AuraEnabled public Weight weight;
    }
    
    public class RequestedShipment {
        @AuraEnabled public Shipper shipper;
        @AuraEnabled public Shipper recipient;
        @AuraEnabled public String pickupType;
        @AuraEnabled public List<String> rateRequestType;
        @AuraEnabled public List<RequestedPackageLineItems> requestedPackageLineItems;
    }
    
    public class Weight {
        @AuraEnabled public String units;
        @AuraEnabled public Integer value;
    }
    
    public class AccountNumber {
        @AuraEnabled public String value = '740561073';
    }
    
    public static Fedex_GetRatesController parse(String json) {
        return (Fedex_GetRatesController) System.JSON.deserialize(json, Fedex_GetRatesController.class);
    }
}
