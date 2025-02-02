const { dockStart } = require('@nlpjs/basic');
const { GreenHomeComponent } = require('./utils/GreenHomeComponent')

async function compute(userInput) {
    const dock = await dockStart();
    const nlp = dock.get('nlp');
    await nlp.train();
    const response = await nlp.process('en', userInput);

    return response.answer;
}

async function fsmProcessState(response, fsm, nlp) {
    const intent = response.intent;
    let reply;
    console.log(intent)
    console.log("siamo in " + fsm.state)
    switch(intent) {
        case 'device.dailyOffender':
            reply = await fsm.dispatch("getOffender", nlp)
            break;
        case 'device.genericTip':
            reply = await fsm.dispatch("getGenericTip", nlp)
            break;
        case 'user.approval':
            reply = await fsm.dispatch("approve", nlp)
            break;
        case 'user.negate':
            reply = await fsm.dispatch("negateOrDefault", nlp)
            break;
        case 'device.specificTip':
            reply = await fsm.dispatch("getSpecificTip", nlp, response.entities[0].option)
            break;
        case 'device.offenderInfo':
            reply = await fsm.dispatch("howOffenderIsChosen", nlp)
            break;
        case 'agent.leafyStatus': {
            const ghc = new GreenHomeComponent()
            if (ghc.treeLevel.data < 2) {
                response.answer += ". Do you want a reminder on how I work?"
                reply = await fsm.dispatch("proposeLeafyExplanation", nlp)
            } else {
                reply = await fsm.dispatch('negateOrDefault', nlp)
            }
            break;
        }
        case 'dashboard.yesterdayConsumption':
            reply = await fsm.dispatch("getConsumptionYesterday", nlp)
            break;
        case 'dashboard.monthConsumption':
            reply = await fsm.dispatch("getConsumptionMonth", nlp)
            break;
        case 'onboarding.genericInfo':
                reply = await fsm.dispatch("getGenericInfo", nlp)
                break;

        case 'onboarding.graphInfo':
                reply = await fsm.dispatch("genericReturnFalse", nlp)
                break;
        default :
            console.log(response.intent)
            reply = await fsm.dispatch('negateOrDefault', nlp)
            break;
    }

    console.log(fsm.state)
    if (reply.reply == null) {
        reply.reply = response.answer
    }

    return reply
}

const FSM =  {
    state: 'RESET',
    currentDevice: null, //extra info to track the device the user is talking about
    transitions: {
        RESET : {
            getOffender() {
                this.currentDevice = new GreenHomeComponent().offender.name
                this.state = 'WAIT_APPROVAL_FOR_SPECIFIC_TIP'
                return {reply: null, interactionEnd: false}
            },
            async getGenericTip(nlp) {
                this.state = 'WAIT_APPROVAL_FOR_GENERIC_TIP'
                return {reply: (await nlp.process("how can i consume less")).answer+" Do you want another tip?", interactionEnd: false}
            },
            howOffenderIsChosen() {
                this.state = 'OFFENDER_INFO'
                return {reply: null, interactionEnd: false}
            },
            getSpecificTip(nlp, device) {
                this.currentDevice = device
                console.log(this.currentDevice)
                this.state = 'WAIT_APPROVAL_FOR_SPECIFIC_TIP'
                return {reply: null, interactionEnd: false}
            },
            proposeLeafyExplanation() {
                this.state = 'WAIT_APPROVAL_LEAFY_INFO'
                return {reply: null, interactionEnd: false}
            },
            getConsumptionYesterday() {
                this.state = 'WAIT_APPROVAL_YESTERDAY_DETAIL'
                return {reply: null, interactionEnd: false}
            },
            getConsumptionMonth(){
                this.state = 'WAIT_APPROVAL_MONTH_DETAIL'
                return {reply: null, interactionEnd: false}
            },
            getGenericInfo(){
                this.state = 'WAIT_APPROVAL_INFO_DETAIL'
                return {reply: null, interactionEnd: false}
            },
            genericReturnFalse(){
                this.state = 'RESET'
                return {reply: null, interactionEnd: false}
            }

        },
        OFFENDER_INFO: {
            async approve(nlp) {
                this.state = 'WAIT_APPROVAL_FOR_GENERIC_TIP'
                return {reply: (await nlp.process("how can i consume less ")).answer+" Do you want another tip?", interactionEnd: false}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            }
        },
        WAIT_APPROVAL_FOR_SPECIFIC_TIP: {
            async approve(nlp) {
                return {reply: (await nlp.process("how can i consume less with the " + this.currentDevice)).answer, interactionEnd: false}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            },
            // non canonical interactions, but if they happen they're managed correctly
            getOffender(nlp) {
                this.state = 'RESET'
                return this.dispatch('getOffender', nlp)
            },
            howOffenderIsChosen(nlp) {
                this.state = 'RESET'
                return this.dispatch('howOffenderIsChosen', nlp)
            },
            getConsumptionYesterday(nlp) {
                this.state = 'RESET'
                return this.dispatch('getConsumptionYesterday', nlp)
            },
            getConsumptionMonth(nlp){
                this.state = 'RESET'
                return this.dispatch('getConsumptionMonth', nlp)
            },
            getGenericInfo(nlp){
                this.state = 'RESET'
                return this.dispatch('getGenericInfo', nlp)
            },
            async getGenericTip(nlp) {
                this.state = 'RESET'
                return this.dispatch('getGenericTip', nlp)
            },
            proposeLeafyExplanation(nlp) {
                this.state = 'RESET'
                return this.dispatch('proposeLeafyExplanation', nlp)
            },
        },
        WAIT_APPROVAL_FOR_GENERIC_TIP: {
            async approve(nlp) {
                return {reply: (await nlp.process("how can i consume less")).answer+" Do you want another tip?", interactionEnd: false}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            },
            // non canonical interactions, but if they happen they're managed correctly
            getOffender(nlp) {
                this.state = 'RESET'
                return this.dispatch('getOffender', nlp)
            },
            howOffenderIsChosen(nlp) {
                this.state = 'RESET'
                return this.dispatch('howOffenderIsChosen', nlp)
            },
            getConsumptionYesterday(nlp) {
                this.state = 'RESET'
                return this.dispatch('getConsumptionYesterday', nlp)
            },
            getConsumptionMonth(nlp){
                this.state = 'RESET'
                return this.dispatch('getConsumptionMonth', nlp)
            },
            getGenericInfo(nlp){
                this.state = 'RESET'
                return this.dispatch('getGenericInfo', nlp)
            },
            getSpecificTip(nlp, device) {
                this.currentDevice = device
                console.log(this.currentDevice)
                this.state = 'RESET'
                return this.dispatch('getSpecificTip', nlp, device)
            },
            proposeLeafyExplanation(nlp) {
                this.state = 'RESET'
                return this.dispatch('proposeLeafyExplanation', nlp)
            },
        },
        WAIT_APPROVAL_LEAFY_INFO: {
            async approve(nlp) {
                this.state = 'LEAFY_INFO'
                return {reply: (await nlp.process("how do you work")).answer, interactionEnd: true}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            },
            // non canonical interactions, but if they happen they're managed correctly
            getOffender(nlp) {
                this.state = 'RESET'
                return this.dispatch('getOffender', nlp)
            },
            howOffenderIsChosen(nlp) {
                this.state = 'RESET'
                return this.dispatch('howOffenderIsChosen', nlp)
            },
            getConsumptionYesterday(nlp) {
                this.state = 'RESET'
                return this.dispatch('getConsumptionYesterday', nlp)
            },
            getConsumptionMonth(nlp){
                this.state = 'RESET'
                return this.dispatch('getConsumptionMonth', nlp)
            },
            getGenericInfo(nlp){
                this.state = 'RESET'
                return this.dispatch('getGenericInfo', nlp)
            },
            async getGenericTip(nlp) {
                this.state = 'RESET'
                return this.dispatch('getGenericTip', nlp)
            },
            getSpecificTip(nlp, device) {
                this.currentDevice = device
                console.log(this.currentDevice)
                this.state = 'RESET'
                return this.dispatch('getSpecificTip', nlp, device)
            },
            proposeLeafyExplanation(nlp) {
                this.state = 'RESET'
                return this.dispatch('proposeLeafyExplanation', nlp)
            },
        },
        WAIT_APPROVAL_YESTERDAY_DETAIL: {
            async approve(nlp) {
                this.state = 'RESET'
                return {reply: (await nlp.process("Hey leafy, yesterday in detail")).answer, interactionEnd: true}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            },
            // non canonical interactions, but if they happen they're managed correctly
            getOffender(nlp) {
                this.state = 'RESET'
                return this.dispatch('getOffender', nlp)
            },
            howOffenderIsChosen(nlp) {
                this.state = 'RESET'
                return this.dispatch('howOffenderIsChosen', nlp)
            },
            getConsumptionMonth(nlp){
                this.state = 'RESET'
                return this.dispatch('getConsumptionMonth', nlp)
            },
            getGenericInfo(nlp){
                this.state = 'RESET'
                return this.dispatch('getGenericInfo', nlp)
            },
            async getGenericTip(nlp) {
                this.state = 'RESET'
                return this.dispatch('getGenericTip', nlp)
            },
            getSpecificTip(nlp, device) {
                this.currentDevice = device
                console.log(this.currentDevice)
                this.state = 'RESET'
                return this.dispatch('getSpecificTip', nlp, device)
            },
            proposeLeafyExplanation(nlp) {
                this.state = 'RESET'
                return this.dispatch('proposeLeafyExplanation', nlp)
            },
        },
        WAIT_APPROVAL_INFO_DETAIL: {
            async approve(nlp) {
                this.state = 'RESET'
                return {reply: (await nlp.process("What graphs can i view")).answer, interactionEnd: true}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            },
            // non canonical interactions, but if they happen they're managed correctly
            getOffender(nlp) {
                this.state = 'RESET'
                return this.dispatch('getOffender', nlp)
            },
            howOffenderIsChosen(nlp) {
                this.state = 'RESET'
                return this.dispatch('howOffenderIsChosen', nlp)
            },
            getConsumptionYesterday(nlp) {
                this.state = 'RESET'
                return this.dispatch('getConsumptionYesterday', nlp)
            },
            getConsumptionMonth(nlp){
                this.state = 'RESET'
                return this.dispatch('getConsumptionMonth', nlp)
            },
            getGenericInfo(nlp){
                this.state = 'RESET'
                return this.dispatch('getGenericInfo', nlp)
            },
            async getGenericTip(nlp) {
                this.state = 'RESET'
                return this.dispatch('getGenericTip', nlp)
            },
            getSpecificTip(nlp, device) {
                this.currentDevice = device
                console.log(this.currentDevice)
                this.state = 'RESET'
                return this.dispatch('getSpecificTip', nlp, device)
            },
            proposeLeafyExplanation(nlp) {
                this.state = 'RESET'
                return this.dispatch('proposeLeafyExplanation', nlp)
            },
        },
        WAIT_APPROVAL_MONTH_DETAIL: {
            async approve(nlp) {
                this.state = 'RESET'
                return {reply: (await nlp.process("show me in detail last month")).answer, interactionEnd: true}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            },
            // non canonical interactions, but if they happen they're managed correctly
            getOffender(nlp) {
                this.state = 'RESET'
                return this.dispatch('getOffender', nlp)
            },
            howOffenderIsChosen(nlp) {
                this.state = 'RESET'
                return this.dispatch('howOffenderIsChosen', nlp)
            },
            getConsumptionYesterday(nlp) {
                this.state = 'RESET'
                return this.dispatch('getConsumptionYesterday', nlp)
            },
            getGenericInfo(nlp){
                this.state = 'RESET'
                return this.dispatch('getGenericInfo', nlp)
            },
            async getGenericTip(nlp) {
                this.state = 'RESET'
                return this.dispatch('getGenericTip', nlp)
            },
            getSpecificTip(nlp, device) {
                this.currentDevice = device
                console.log(this.currentDevice)
                this.state = 'RESET'
                return this.dispatch('getSpecificTip', nlp, device)
            },
            proposeLeafyExplanation(nlp) {
                this.state = 'RESET'
                return this.dispatch('proposeLeafyExplanation', nlp)
            },
        },
        LEAFY_INFO: {
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            }
        },
        LEAFY_PROGRESS: {
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            }
        },
        TODAY_CONSUMPTION: {
            approve() {
                this.state = 'CONSUMPTION_HISTORY_DETAIL'
                return {reply: null, interactionEnd: false}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            }
        },
        CONSUMPTION_HISTORY_DETAIL: {
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            }
        },
        CONSUMPTION_HISTORY_YESTERDAY: {
            approve() {
                this.state = 'RESET'
                return {reply: null, interactionEnd: false}
            },
            negateOrDefault() {
                this.state = 'RESET'
                this.currentDevice = null
                return {reply: null, interactionEnd: true}
            }
        }
    },
    async dispatch(actionName, nlp, device=null) {
        const action = this.transitions[this.state][actionName];

        if (action) {
            if (device != null) {
                return await action.call(this, nlp, device)
            } else {
                const res = await action.call(this, nlp);
                console.log(res)
                return res
            }
        } else {
            console.log('invalid action')
            this.state = 'RESET'
            return {reply: null, interactionEnd: true}
        }
    }
}

module.exports = { compute, fsmProcessState, FSM};
