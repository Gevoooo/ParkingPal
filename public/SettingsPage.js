document.addEventListener("DOMContentLoaded", event => {
    const auth = firebase.auth();
    auth.onAuthStateChanged(async (user) => {
        setDefaultValues(user);
    });
});


/**
 * this adds a vehicle doc to the Vehicle collection
 * adds the doc reference to customer vehicle map
 */
async function addVehicle(){
    var errorField = document.getElementById("addvehicle-notification-text");
    errorField.innerHTML = "";
    errorField.style.setProperty("color", "red");
    //variables
    var fuelType,handicapBool,licensePlate,make,model,motoBool,year,customerID;
    //link db
    const user=firebase.auth().currentUser;
    const db=firebase.firestore();
    //assign specific collection
    const vehicleDB=db.collection("Vehicle");
    await db.collection("Account").doc(user.uid).get()
    .then((userDoc)=>{
        customerID=userDoc.data().Profile.slice(9);
    })
    .catch((error)=>{
        console.log("Failed to find Customer doc: "+error);
    });
    const customerDB=db.collection("Customer").doc(customerID);
    //get info from HTML
    make=document.getElementById("carMake").value;
    model=document.getElementById("addCarModel").value;
    year=document.getElementById("addCarYear").value;
    licensePlate=document.getElementById("addLicensePlate").value;
    fuelType=document.getElementById("FuelType").value;
    motoBool=document.getElementById("newVehicleMoto").checked;
    handicapBool=document.getElementById("newVehicleHandicap").checked;
    var today = new Date();
    //catches errors
    if(inputNullOrEmpty(make)){
        errorField.innerHTML="Please enter the make of the car";
    }
    else if(inputNullOrEmpty(model)){
        errorField.innerHTML="Please enter the model of the car";
    }
    else if(inputNullOrEmpty(year) || isNaN(year) || year < 1900 || year > parseInt(today.getFullYear)){
        errorField.innerHTML="Please enter the make year of the car";
    }
    else if(inputNullOrEmpty(licensePlate)){
        errorField.innerHTML="Please enter the license plate number";
    }
    else if(inputNullOrEmpty(fuelType)){
        errorField.innerHTML="Please enter the fuel type";
    } else {
        //adds it to a doc
        var vehicleDoc={
            FuelType: fuelType,
            Handicap: handicapBool,
            LicensePlate: licensePlate,
            Make: make,
            Model: model,
            Moto: motoBool,
            Year: year
        };
        //adds it do database
        await vehicleDB.add(vehicleDoc)
        .then((document)=>{
            var vehicleRef = "Vehicle/"+document.id;
            customerDB.update({
                Vehicles: firebase.firestore.FieldValue.arrayUnion(vehicleRef)
            });
            errorField.innerHTML = "";
            closePopup("addVehicle");
            displayOneVehicle(vehicleRef);
        })
        .catch((error)=>{
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode + " --- " + errorMessage);  
        });
    }
}

/**
 * this will delete the vehicle document
 * this will remove the reference from customer
 * @param {*} VehicleRef 
 */
async function deleteVehicle(VehicleRef){
    //variables
    var customerID;
    var vehicleLink="Vehicle/"+VehicleRef;
    //link db
    const user=firebase.auth().currentUser,db=firebase.firestore();
    //gets customer doc id
    const userAccount=await db.collection("Account").doc(user.uid);
    await db.collection("Account").doc(user.uid).get()
    .then((userDoc)=>{
        customerID=userDoc.data().Profile.slice(9);
    })
    .catch((error)=>{
        console.log("Failed to find Customer doc: "+error);
    });
    //deletes from customer array
    await db.collection("Customer").doc(customerID)
    .update({
        Vehicles: firebase.firestore.FieldValue.arrayRemove(vehicleLink)
    });
    //deletes doc from database
    await db.collection("Vehicle").doc(VehicleRef).delete();
    //updates HTML code
    document.getElementById(VehicleRef).remove();
}

function saveChanges() {
    var errorField = document.getElementById("account-notification-text");
    errorField.innerHTML = "";
    errorField.style.setProperty("color", "red");
    var user = firebase.auth().currentUser;
    var first = document.getElementById("accountFirstName");
    var last = document.getElementById("accountLastName");

    if (inputNullOrEmpty(first.value)) {
        errorField.innerHTML = "Enter your first name"
        return;
    } else if (inputNullOrEmpty(last.value)) {
        errorField.innerHTML = "Enter your last name"
        return;
    } else {
        firebase.firestore().collection("Account").doc(user.uid)
        .update({
            FirstName: first.value,
            LastName: last.value
        })
        .then(() => {
            errorField.style.setProperty("color", "green");
            errorField.innerHTML = "Changes saved!";
        });
    }
}

/**
 * This will add a payment method and link it to the customer
 */
async function addPayment(){
    var errorField = document.getElementById("add-payment-notification-text");
    errorField.innerHTML = "";
    errorField.style.setProperty("color", "red");
    //variables
    var cvvNum,cardNum,expire,customerID,copyCheck=false;
    //links to database
    const user=firebase.auth().currentUser,db=firebase.firestore();
    await db.collection("Account").doc(user.uid).get()
    .then((userDoc)=>{
        customerID=userDoc.data().Profile.slice(9);
    })
    .catch((error)=>{
        console.log("Failed to find Customer doc: "+error);
        return;
    });
    const paymentDB=db.collection("Payment");
    //gets info from the HTML
    cvvNum=document.getElementById("addSVC").value;
    cardNum=document.getElementById("addCardNum").value;
    expire=new Date(document.getElementById("addExpDate").value);
    //error check
    await paymentDB.where('CardNum','==',cardNum).get()
    .then((querySnapshot)=>{
        querySnapshot.forEach((doc) => {copyCheck=true;})
    })
    .catch((error)=>{
        console.log("There was issue: "+error);
        return;
    })
    if(inputNullOrEmpty(cvvNum)&&cvvNum>99&&cvvNum<1000){
        errorField.innerHTML = "Please enter a valid CVV";
    }
    else if(inputNullOrEmpty(cardNum)){
        errorField.innerHTML = "Please enter a card number";
    }
    else if(inputNullOrEmpty(expire) || isNaN(expire.getTime())){
        errorField.innerHTML = "Please enter an expiration date for your card";
    }
    else if(copyCheck){
        errorField.innerHTML = "This card is already in the system, please delete the card before continuing";
    } else {
        //makes doc
        var paymentDoc={
            CVV: parseInt(cvvNum),
            CardNum: parseInt(cardNum),
            Expiration: firebase.firestore.Timestamp.fromDate(expire)
        };
        await paymentDB.add(paymentDoc)
        .then((updateDoc)=>{
            var paymentRef = "Payment/"+updateDoc.id;
            db.collection("Customer").doc(customerID).update({
                Payments: firebase.firestore.FieldValue.arrayUnion(paymentRef)
            });
            errorField.innerHTML = "";
            displayOnePayment(paymentRef);
            closePopup("addPayment");
        })
        .catch((error)=>{
            console.log("Issue with adding payment to customer doc: "+error);
        });
    }
}

/**
 * this will remove a payment method and delink it from the customer
 * @param {*} PaymentRef 
 */
async function removePayment(PaymentRef){
    //variables
    var customerID;
    //links to database
    const user=firebase.auth().currentUser,db=firebase.firestore();
    const paymentDB=db.collection("Payment");
    //gets customer doc id
    await db.collection("Account").doc(user.uid).get()
    .then((userDoc)=>{
        customerID=userDoc.data().Profile.slice(9);
    })
    .catch((error)=>{
        console.log("Failed to find Customer doc: "+error);
    });
    //deletes from customer array
    await db.collection("Customer").doc(customerID)
    .update({
        Payments: firebase.firestore.FieldValue.arrayRemove("Payment/" + PaymentRef)
    });
    //deletes doc from database
    await paymentDB.doc(PaymentRef).delete();
    //updates HTML code
    document.getElementById(PaymentRef).remove();
}

async function removeVehicle(vehicleRef){
    //variables
    var customerID;
    //links to database
    const user=firebase.auth().currentUser,db=firebase.firestore();
    const vehicleDB=db.collection("Vehicle");
    //gets customer doc id
    await db.collection("Account").doc(user.uid).get()
    .then((userDoc)=>{
        customerID=userDoc.data().Profile.slice(9);
    })
    .catch((error)=>{
        console.log("Failed to find Customer doc: "+error);
    });
    //deletes from customer array
    await db.collection("Customer").doc(customerID)
    .update({
        Vehicles: firebase.firestore.FieldValue.arrayRemove("Vehicle/" + vehicleRef)
    });
    //deletes doc from database
    await vehicleDB.doc(vehicleRef).delete();
    //updates HTML code
    document.getElementById(vehicleRef).remove();
}

/**
 * adds billing information to database
 * links to manager doc
 */
async function addBilling(){
    var errorField = document.getElementById("add-billing-notification-text");
    errorField.innerHTML = "";
    errorField.style.setProperty("color", "red");
    //variables
    var accountNum,address,org,routingNum;
    //links database
    const user=firebase.auth().currentUser,db=firebase.firestore();
    var managerRef = "";
    await db.collection("Account").doc(user.uid).get()
    .then((doc)=>{
        managerRef = doc.data().Profile.slice(8);
    })
    .catch((error)=>{
        console.log("Couldn't find account doc: "+error);
    });

    const billingDB=db.collection("Billing"),managerDB=db.collection("Manager").doc(managerRef);
    //gets data from HTML
    accountNum=document.getElementById("accountNum").value;
    address=document.getElementById("orgAddress").value;
    org=document.getElementById("organization").value;
    routingNum=document.getElementById("routingNum").value;
    //error checking
    if(inputNullOrEmpty(org)){
        errorField.innerHTML = "Please enter a valid organization";
    }
    else if(inputNullOrEmpty(address)){
        errorField.innerHTML = "Please enter a valid address";
    }
    else if(inputNullOrEmpty(accountNum) || isNaN(accountNum)){
        errorField.innerHTML = "Please enter a valid account number";
    }
    else if(inputNullOrEmpty(routingNum) || isNaN(routingNum)){
        errorField.innerHTML = "Please enter a valid routing number";
    }
    //making doc
    var billingDoc={
        AccountNum: accountNum,
        Address: address,
        Organization: org,
        RoutingNum:routingNum
    };
    //add to database
    await billingDB.add(billingDoc)
    .then((updateDoc)=>{
        managerDB.update({
            Billing: firebase.firestore.FieldValue.arrayUnion("Billing/"+updateDoc.id)
        })
        .catch((error)=>{
            console.log("Couldn't find Manager doc: "+error);
        });
        displayOneBilling("Billing/"+updateDoc.id);
        closePopup("addBilling");
    })
    .catch((error)=>{
        console.log("Couldn't add the doc to billing: "+error);
    });
}

/**
 * changes billing in database
 * @param {*} BillingRef 
 */
async function saveBillingChanges(BillingRef){
    //variables
    var accountNum,address,org,routingNum;
    //links to database
    const user=firebase.auth().currentUser,db=firebase.firestore();
    const billingDB=db.collection("Billing").doc(BillingRef);
    //gets data from HTML
    accountNum=document.getElementById("accountNum").value;
    address=document.getElementById("orgAddress").value;
    org=document.getElementById("organization").value;
    routingNum=document.getElementById("routingNum").value;
    //error checking
    if(inputNullOrEmpty(accountNum) || isNaN(routingNum)){
        errorField.innerHTML = "Please enter a valid account number";
    }
    else if(inputNullOrEmpty(address)){
        errorField.innerHTML = "Please enter a valid address";
    }
    else if(inputNullOrEmpty(org)){
        errorField.innerHTML = "Please enter a valid organization";
    }
    else if(inputNullOrEmpty(routingNum) || isNaN(routingNum)){
        errorField.innerHTML = "Please enter a valid routing number";
    }
    //making doc
    var billingDoc={
        accountNum: accountNum,
        Address: address,
        Organization: org,
        RoutingNum:routingNum
    };
    //merges doc
    await billingDB.set(billingDoc,{merge:true});
}

/**
 * This deletes the billing doc
 * this deletes the reference from the manager doc
 * this deletes the reference from the garage doc
 * @param {*} BillingRef 
 */
async function removeBilling(BillingRef){
    //variables
    const user=firebase.auth().currentUser,db=firebase.firestore();
    const billingDB=db.collection("Billing"),managerDB=db.collection("Manager"),garageDB=db.collection("Garage");
    var billingLink="Billing/"+BillingRef;
    var managerID;
    //gets customer doc id
    await db.collection("Account").doc(user.uid).get()
    .then((userDoc)=>{
        managerID=userDoc.data().Profile.slice(8);
    })
    .catch((error)=>{
        console.log("Failed to find Manager doc: "+error);
    });
    //deletes from manager array
    await managerDB.doc(managerID)
    .update({
        Billing: firebase.firestore.FieldValue.arrayRemove(billingLink)
    })
    .catch((error)=>{
        console.log("Error deleting billing from manager: "+error);
    });
    //deletes from garage
    await garageDB.where('Billing','==',billingLink).get()
    .then((querySnapshot)=>{
        querySnapshot.forEach((doc)=>{
            garageDB.doc(doc)
            .update({
                Billing: ""
            })
            .catch((error)=>{
                console.log("Error deleting billing from singular garage: "+error);
            });
        })
    })
    .catch((error)=>{
        console.log("Error deleting billing from garage: "+error);
    });
    //deletes billing doc
    await billingDB.doc(BillingRef).delete()
    .catch((error)=>{
        console.log("Error deleting billing from billing: "+error);
    });
    //updates HTML code
    document.getElementById(BillingRef).remove();
}

async function setDefaultValues(user){
    const db = firebase.firestore();
    const accFirst = document.getElementById("accountFirstName");
    const accLast = document.getElementById("accountLastName");
    const accEmail = document.getElementById("accountEmail");

    await db.collection("Account").doc(user.uid)
    .get()
    .then((doc) => {
        var data = doc.data();
        accFirst.value = data.FirstName;
        accLast.value = data.LastName;
        accEmail.value = data.Email;
        if (data.Profile.includes("Manager")) {
            setDefaultBilling(data.Profile.slice(8));
        } else {
            setDefaultPaymentAndVehicles(data.Profile.slice(9));
        }
    });
}

async function setDefaultPaymentAndVehicles(customerRef) {
    const db = firebase.firestore();
    const profileInfo = await db.collection('Customer').doc(customerRef);
    profileInfo.get()
    .then((doc) => {
        var data = doc.data();
        var paymentList = data.Payments;
        paymentList.forEach(displayOnePayment);
        var vehicleList = data.Vehicles;
        vehicleList.forEach(displayOneVehicle);
    })
    .catch((error) => {
        console.log("Failed to find customer doc: " + error);
    });
}

async function displayOnePayment(paymentRef) {
    let paymentList = document.getElementById('paymentList');
    var newPayment = document.createElement('li');
    var pNumber = document.createElement('p');
    var pExpiration = document.createElement('p');
    const db = firebase.firestore();
    await db.collection('Payment').doc(paymentRef.slice(8)).get()
    .then((doc) => {
        const data = doc.data();
        const gNum = String(data.CardNum).slice(-4);
        var expDate = data.Expiration.toDate();
        const gExpiration = "" + (parseInt(expDate.getMonth()) + 1) + "/" + String(expDate.getFullYear()).slice(2);
        pNumber.innerHTML = "Card ending with: " + gNum;
        pExpiration.innerHTML = "Expires: " + gExpiration;
        newPayment.id = doc.id;

        var delPaymentButton = document.createElement('button');
        delPaymentButton.className = "text-gray-500 font-bold text-4xl self-center items-center float-right hover:text-red-700 hover:no-underline hover:cursor-pointer";
        delPaymentButton.innerHTML = "&times"
        delPaymentButton.onclick = function() {removePayment(paymentRef.slice(8))};
        var mainDiv = document.createElement('div');
        mainDiv.className = "bg-slate-300 p-3 ml-3 mr-3 mb-3 rounded-xl grid grid-cols-2";

        var leftDiv = document.createElement('div');
        leftDiv.appendChild(pNumber);
        leftDiv.appendChild(pExpiration);
        var rightDiv = document.createElement('div');
        rightDiv.appendChild(delPaymentButton);

        mainDiv.appendChild(leftDiv);
        mainDiv.appendChild(rightDiv);
        newPayment.appendChild(mainDiv);
        paymentList.appendChild(newPayment);
    })
    .catch((error) => {
        console.log("Failed to find payment info doc" + error);
    });
}

async function displayOneVehicle(vehicleRef) {
    let vehicleList = document.getElementById('vehicleList');
    var newVehicle = document.createElement('li');
    var pName = document.createElement('p');
    var pPlate = document.createElement('p');
    var pHandicap = document.createElement('p');
    var pMoto = document.createElement('p');

    const db = firebase.firestore();
    await db.collection('Vehicle').doc(vehicleRef.slice(8)).get()
    .then((doc) => {
        const data = doc.data();
        pName.innerHTML = "" + data.Year + " " + data.Make + " " + data.Model;
        pPlate.innerHTML = "" + "Plate Number: " + data.LicensePlate;
        pHandicap.innerHTML = "Handicap: " + data.Handicap;
        pMoto.innerHTML = "Motorcycle: " + data.Moto;
        newVehicle.id = doc.id;

        var delVehicleButton = document.createElement('button');
        delVehicleButton.className = "text-gray-500 font-bold text-4xl self-center items-center float-right hover:text-red-700 hover:no-underline hover:cursor-pointer";
        delVehicleButton.innerHTML = "&times"
        delVehicleButton.onclick = function() {removeVehicle(vehicleRef.slice(8))};
        var mainDiv = document.createElement('div');
        mainDiv.className = "bg-slate-300 p-3 ml-3 mr-3 mb-3 rounded-xl grid grid-cols-2";

        var leftDiv = document.createElement('div');
        leftDiv.appendChild(pName);
        leftDiv.appendChild(pPlate);
        leftDiv.appendChild(pHandicap);
        leftDiv.appendChild(pMoto);

        var rightDiv = document.createElement('div');
        rightDiv.appendChild(delVehicleButton);

        mainDiv.appendChild(leftDiv);
        mainDiv.appendChild(rightDiv);
        newVehicle.appendChild(mainDiv);
        vehicleList.appendChild(newVehicle);
    })
    .catch((error) => {
        console.log("Failed to find vehicle info doc" + error);
    });
}

async function setDefaultBilling(managerRef) {
    const db = firebase.firestore();
    const profileInfo = await db.collection('Manager').doc(managerRef);
    profileInfo.get()
    .then((doc) => {
        var data = doc.data();
        var billingList = data.Billing;
        billingList.forEach(displayOneBilling);
    })
    .catch((error) => {
        console.log("Failed to find manager doc: " + error);
    });
}

async function displayOneBilling(billingRef) {
    let billingList = document.getElementById('billingList');
    var newBilling = document.createElement('li');
    var pOrganization = document.createElement('p');
    var pAddress = document.createElement('p');
    var pAccountNum = document.createElement('p');
    var pRoutingNum = document.createElement('p');

    const db = firebase.firestore();
    await db.collection('Billing').doc(billingRef.slice(8)).get()
    .then((doc) => {
        const data = doc.data();
        pOrganization.innerHTML = "" + data.Organization;
        pAddress.innerHTML = "" + "" + data.Address;
        pAccountNum.innerHTML = "Account: " + data.AccountNum;
        pRoutingNum.innerHTML = "Routing: " + data.RoutingNum;
        newBilling.id = doc.id;

        var delBillingButton = document.createElement('button');
        delBillingButton.className = "text-gray-500 font-bold text-4xl self-center items-center float-right hover:text-red-700 hover:no-underline hover:cursor-pointer";
        delBillingButton.innerHTML = "&times"
        delBillingButton.onclick = function() {removeBilling(billingRef.slice(8))};
        var mainDiv = document.createElement('div');
        mainDiv.className = "bg-slate-300 p-3 ml-3 mr-3 mb-3 rounded-xl grid grid-cols-2";

        var leftDiv = document.createElement('div');
        leftDiv.appendChild(pOrganization);
        leftDiv.appendChild(pAddress);
        leftDiv.appendChild(pAccountNum);
        leftDiv.appendChild(pRoutingNum);

        var rightDiv = document.createElement('div');
        rightDiv.appendChild(delBillingButton);

        mainDiv.appendChild(leftDiv);
        mainDiv.appendChild(rightDiv);
        newBilling.appendChild(mainDiv);
        billingList.appendChild(newBilling);
    })
    .catch((error) => {
        console.log("Failed to find billing info doc" + error);
    });
}