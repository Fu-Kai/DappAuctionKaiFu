import Web3 from 'web3'
//@ts-ignore
import OpenAuction from './OpenAuction.json'
// const ipfs = await IPFS.create()
// const { cid } = await ipfs.add('Hello world')
// console.info(cid)
//@ts-ignore
const web3 = new Web3(window.ethereum);
const contract = new web3.eth.Contract(OpenAuction.abi, '0xBbc5a4d78496f405ff1E86AA5F4DE05507d5dFA4');
const MyTokenContract = 0xC40ed66aE773Ca6feA8493b9862A54671e096B80;
const pointsErc20Contract = 1;

function addListener(fn: Function) {
    //@ts-ignore
    ethereum.on('accountsChanged', fn)
}

export declare interface Bidder {
    index: number,
    addr: string,
    bidAmount: number,
    bidTime:number
}

export declare interface Auction {
    index: number,
    title: string,
    info: string,
    amountStart: number,
    bond: number,
    beneficiary: string,
    highestBidder: string,
    highestBid: number,
    numBidders: number,
    startFlg: boolean,
    endFlg: boolean,
    endTime: number,
    myBidAmount?: number
}

// export declare interface Use {
//     index: number,
//     info: string,
//     goal: string,
//     agreeAmount: string,
//     disagree: string,
//     over: boolean,
//     agree: number // 0: 没决定，1同意，2不同意
// }

async function authenticate() {
    //@ts-ignore
    await window.ethereum.enable();
}

async function getAccount() {
    return (await web3.eth.getAccounts())[0];
}


async function getOneAuction(index:number) : Promise<Auction> {
    const data = await contract.methods.auctions(index).call();
    data.amountStart = Web3.utils.fromWei(data.amountStart, 'ether')
    data.highestBid = Web3.utils.fromWei(data.highestBid, 'ether')
    data.bond = Web3.utils.fromWei(data.bond, 'ether')
    return {index, ...data}
}

async function getAllAuctions() : Promise<Auction[]> {
    const length = await contract.methods.auctionsLen().call();
    const result = []
    for(let i=1; i<=length; i++)
        result.push(await getOneAuction(i));
    console.log("auctions",result);
    return result;
}


async function getOneAuctionOneBidInfo(index:number, num:number) : Promise<Bidder> {

    const data = await contract.methods.getOneAuctionBidInfo(index, num).call();
    data.bidAmount = Web3.utils.fromWei(data.bidAmount, 'ether')
    return {index, ...data}
}
async function getOneAuctionAllBidInfo(index:number) : Promise<Bidder[]> {

    const result = [];
    const num = await contract.methods.getBiddersNum(index).call();
    for (let i = 1; i <= num; i++) {
        result.push(await getOneAuctionOneBidInfo(index, i));
    }
    console.log("info",result);
    return result;
}

async function getOneAuctionBiddersNum(index:number) : Promise<number> {
    return await contract.methods.getBiddersNum(index).call();
}

async function getBalance() : Promise<number> {
    const account = await getAccount();
    return parseInt(Web3.utils.fromWei(await web3.eth.getBalance(account)));
}
async function getContractBalance() : Promise<number> {
    return parseInt(Web3.utils.fromWei(await contract.methods.getBalance().call(), 'ether'));
}

async function getThisAuctionHighestBid(index:number) : Promise<number> {
    const account = await getAccount();
    return parseInt(Web3.utils.fromWei(await contract.methods.auctions(index).call().highestBid, 'ether'));
}
async function getMyBidAmount(index:number) : Promise<number> {
    const account = await getAccount();
    return parseInt(Web3.utils.fromWei(await contract.methods.getMyBidAmount(account, index).call(), 'ether'));
}
async function getMyAuctions() : Promise<{bene: Auction[],  purchase: Auction[], bid: Auction[]}> {
    const account = await getAccount();
    const all = await getAllAuctions();
    const result : {
        bene: Auction[],
        purchase: Auction[],
        bid: Auction[]
    } = {
        bene: [],
        purchase: [],
        bid: []
    };
    for(let auction of all) {
        const myBidAmount = await getMyBidAmount(auction.index);
        if(auction.beneficiary == account) {
            result.bene.push({
                myBidAmount,
                ...auction
            })
        }
        if(account == auction.highestBidder && auction.endFlg) {
            result.purchase.push({
                myBidAmount,
                ...auction
            })
        }
        if(myBidAmount != 0) {
            result.bid.push({
                myBidAmount,
                ...auction
            })
        }
    }
    return result;
}

async function bid(id:number, value:number) {
    return await contract.methods.bid(id).send({from: await getAccount(), value: Web3.utils.toWei(value.toString(10), 'ether')});
}

async function newAuctionStart(account:string, title:string, info:string, amountStart:number, seconds:number) {
    return await contract.methods.newAuctionStart(account, title, info, Web3.utils.toWei(amountStart.toString(10), 'ether'), seconds).send({
        from: account,
        value: Web3.utils.toWei((2*amountStart).toString(10), 'ether'),
        gas: 1000000
    });
}
async function setAuctionEnd(id:number) {
    const account = await getAccount();
    return await contract.methods.setAuctionEnd(id).send({
        from: account,
        gas: 1000000
    })
}

async function withdrawBond (id:number) {
    const account = await getAccount();
    return await contract.methods.withdrawBond(id).send({
        from: account,
        gas: 1000000
    })
}
export {
    getAccount,
    authenticate,
    contract,
    getMyAuctions,
    getAllAuctions,
    getOneAuction,
    getOneAuctionOneBidInfo,
    getOneAuctionAllBidInfo,
    getOneAuctionBiddersNum,
    getThisAuctionHighestBid,
    bid,
    newAuctionStart,
    setAuctionEnd,
    withdrawBond,
    getContractBalance,
    getBalance,
    addListener
}
