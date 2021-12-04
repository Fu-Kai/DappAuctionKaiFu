import Web3 from 'web3'
import * as IPFS from 'ipfs-core'
//@ts-ignore
import OpenAuction from './OpenAuction.json'
// @ts-ignore
import KFAC_Token from './KFAC_Token.json'
// @ts-ignore
import Persons from './Persons.json'

// const ipfs = await IPFS.create()
// const { cid } = await ipfs.add('Hello world')
// console.info(cid)
//@ts-ignore
const web3 = new Web3(window.ethereum);
const personsContractAddress = '0x470e947eA0309596a810A832d886445394308BE1';
const KFACAddress = '0xC40ed66aE773Ca6feA8493b9862A54671e096B80';
const contract = new web3.eth.Contract(OpenAuction.abi, OpenAuction.networks["5777"].address);
const MyTokenContract = new web3.eth.Contract(KFAC_Token, KFACAddress);
const personsContract = new web3.eth.Contract(Persons, personsContractAddress);
// web3.eth.getBlock(402).then(console.log)

function wei2ether(x: any): string {

    return Web3.utils.fromWei(x, 'ether')
}

function ether2wei(x: number): string {
    return Web3.utils.toWei(x.toString(10), 'ether')
}

function addListener(fn: Function) {
    //@ts-ignore
    ethereum.on('accountsChanged', fn)
}

export declare interface Bidder {
    index: number,
    addr: string,
    bidAmount: number,
    bidTime: number
}

export declare interface Good {
    gid: number,
    name: string,
    owner: string,
    picsHash: string,
    used: boolean,
    brand: string,
    intro: string,
    condition: number,
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

//============MyTokenContract methods==============
export declare interface Person {
    account: string,
    ercPoints: number
}

async function getTotalSupply(): Promise<number> {
    return await MyTokenContract.methods.totalSupply().call();
}

async function getCoinName(): Promise<string> {
    return await MyTokenContract.methods.name().call();
}

async function approve(_acc: string, _ercPoints: number) {
    await MyTokenContract.methods.approve(personsContractAddress, ether2wei(_ercPoints)).send({
        from: _acc,
        gas: 1000000
    });
}

//============MyTokenContract methods End==============


//============personsContract methods ==============
async function getPersonErcPoints(): Promise<number> {
    const account = await getAccount();
    return parseInt(wei2ether(await personsContract.methods.getPersonErcPoints(account).call()));
}

async function rewardPersonErcPoints(_sender: string, account: string, ercPoints: number) {
    await personsContract.methods.rewardPersonErcPoints(account, ether2wei(ercPoints)).send({
        from: _sender,
        gas: 1000000
    });
}

async function deductPersonErcPoints(_acc: string, _ercPoints: number) {
    await personsContract.methods.deductPersonErcPoints(_acc, ether2wei(_ercPoints)).send({
        from: _acc,
        gas: 1000000
    });
}

//============personsContract methods End==============


async function authenticate() {
    //@ts-ignore
    await window.ethereum.enable();
}

async function getAccount() {
    return (await web3.eth.getAccounts())[0];
}


async function getOneAuction(index: number): Promise<Auction> {
    const data = await contract.methods.auctions(index).call();
    data.amountStart = wei2ether(data.amountStart);
    data.highestBid = wei2ether(data.highestBid);
    data.bond = wei2ether(data.bond);
    return {index, ...data}
}

async function getAllAuctions(): Promise<Auction[]> {
    const length = await contract.methods.auctionsLen().call();
    const result = []
    //逆序展示，最新发布的排卖在前
    for (let i = length; i >= 1; i--)
        result.push(await getOneAuction(i));
    console.log("auctions", result);
    return result;
}

async function getOneGoodOfAuction(index: number): Promise<Good> {
    const goodId = await contract.methods.auctionBoundGood(index).call();
    //console.log('goodid'+goodId);
    return await contract.methods.goods(goodId).call();
}

async function getAllGood(acc: any): Promise<Good[]> {
    const length = await contract.methods.goodsLen().call();
    const result = []
    //逆序展示，最新发布的排卖在前
    for (let i = length; i >= 1; i--) {
        let g = await contract.methods.goods(i).call();
        if(g.owner == acc)
        result.push(g);
    }

    return result;
}

async function getOneAuctionOneBidInfo(index: number, num: number): Promise<Bidder> {

    const data = await contract.methods.getOneAuctionBidInfo(index, num).call();
    data.bidAmount = wei2ether(data.bidAmount);
    return {index, ...data}
}

async function getOneAuctionAllBidInfo(index: number): Promise<Bidder[]> {
    const result = [];
    const data = await contract.methods.auctions(index).call();
    const num = data.numBidders;
    for (let i = 1; i <= num; i++) {
        result.push(await getOneAuctionOneBidInfo(index, i));
    }
    console.log("info", result);
    return result;
}

async function getBalance(): Promise<number> {
    const account = await getAccount();
    return parseInt(wei2ether(await web3.eth.getBalance(account)));
}

async function getContractBalance(): Promise<number> {
    return parseInt(wei2ether(await contract.methods.getBalance().call()));
}

async function getThisAuctionHighestBid(index: number): Promise<number> {
    return parseInt(wei2ether(await contract.methods.auctions(index).call().highestBid));
}

async function getMyBidAmount(index: number): Promise<number> {
    const account = await getAccount();
    return parseInt(wei2ether(await contract.methods.getMyBidAmount(account, index).call()));
}

async function getMyAuctions(): Promise<{ bene: Auction[], purchase: Auction[], bid: Auction[] }> {
    const account = await getAccount();
    const all = await getAllAuctions();
    const result: {
        bene: Auction[],
        purchase: Auction[],
        bid: Auction[]
    } = {
        bene: [],
        purchase: [],
        bid: []
    };
    for (let auction of all) {
        const myBidAmount = await getMyBidAmount(auction.index);
        if (auction.beneficiary == account) {
            result.bene.push({
                myBidAmount,
                ...auction
            })
        }
        if ((account == auction.highestBidder && auction.endFlg) || (account == auction.beneficiary && auction.endFlg)) {
            result.purchase.push({
                myBidAmount,
                ...auction
            })
        }
        if (myBidAmount != 0) {
            result.bid.push({
                myBidAmount,
                ...auction
            })
        }
    }
    return result;
}

async function bid(id: number, value: number) {
    return await contract.methods.bid(id).send({
        from: await getAccount(),
        value: ether2wei(value)
    });
}

async function newAuctionStart(account: string, title: string, info: string, amountStart: number, seconds: number, _bond: number, used: boolean, brand: string, picsHash: string, name: string, intro: string) {
    return await contract.methods.newAuctionStart(account, title, info, ether2wei(amountStart), seconds, ether2wei(_bond), used, brand, picsHash, name, intro).send({
        from: account,
        value: ether2wei(_bond),
        gas: 1000000
    });
}

async function reAuctionStart( gid: number,account: string, title: string, info: string, amountStart: number, seconds: number, _bond: number, picsHash: string) {
    return await contract.methods.reAuctionStart(gid, account, title, info, picsHash,ether2wei(amountStart), seconds, ether2wei(_bond)).send({
        from: account,
        value: ether2wei(_bond),
        gas: 1000000
    });
}

async function setAuctionEnd(id: number) {
    const account = await getAccount();
    return await contract.methods.setAuctionEnd(id).send({
        from: account,
        gas: 1000000
    })
}

async function withdrawBond(id: number) {
    const account = await getAccount();
    return await contract.methods.withdrawBond(id).send({
        from: account,
        gas: 1000000
    })
}

async function uploadToIpfs(x: any) {
    const ipfs = await IPFS.create()

    // @ts-ignore
    const result = await ipfs.add(x)
    console.info('https://ipfs.io/ipfs/' + result.path)
    return result.path;
}

function BufferToUint8(x: any) {
    // @ts-ignore
    return (Array.prototype.slice.call(new Uint8Array(x)))
}

export {
    getAccount,
    authenticate,
    contract,
    getMyAuctions,
    getAllAuctions,
    getOneAuction,
    getOneGoodOfAuction,
    getAllGood,
    getOneAuctionOneBidInfo,
    getOneAuctionAllBidInfo,
    getThisAuctionHighestBid,
    bid,
    newAuctionStart,
    reAuctionStart,
    setAuctionEnd,
    withdrawBond,
    getContractBalance,
    getBalance,
    addListener,
    getTotalSupply,
    getCoinName,
    getPersonErcPoints,
    rewardPersonErcPoints,
    approve,
    deductPersonErcPoints,
    uploadToIpfs,
    BufferToUint8,
}
