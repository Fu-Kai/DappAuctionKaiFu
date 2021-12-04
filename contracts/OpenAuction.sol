// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OpenAuction {


    // 出价人结构定义
    struct Bidder {
        address payable addr;      // 出价人的地址
        uint bidAmount;            // 出价数额
        uint bidTime;              // 出价时间
    }

    struct Good {
        uint gid;
        string name;
        bool used;
        string picsHash;
        string intro;
        address owner;
        string brand;
        ItemCondition condition;
    }
    struct Auction {
        string title;                                   //商品标题
        string info;                                    //商品简介
        uint  amountStart;                              //起拍金额
        uint  bond;                                     //保证金
        address payable beneficiary;                    //拍卖受益人
        address payable highestBidder;                  //最高出价者
        uint  highestBid;                               //最高出价
        uint numBidders;                                //出价者个数
        mapping(uint => Bidder) Bidders;                //拍卖具体信息
        bool startFlg;                                  //拍卖开始标志
        ItemCondition condition;                        //物品状态枚举类型
        bool endFlg;                                    //拍卖结束标志
        uint endTime;                                   //拍卖期限
    }
    // 物品状态枚举类型
    enum ItemCondition {
        free,
        Bidding,                    //正在拍卖（有出价，在期间内）
        nobodyBid,                  //拍卖结束 无人出价 （时间到期，没有人出价） （卖家可点击按扭退保证金）
        noYetBid,                   //暂无出价  (没到期，出价为0)
        successedAuction,           //拍卖成功 （买家点击收货，将货款和保证金一起结账给卖家）
        inRoad                      //卖家发货中（时间到期，并且已产生最高出价者）
    }

    mapping(uint => Auction) public auctions;           // 所有的拍卖项目
    uint public auctionsLen;                            // 拍卖项目数量
    mapping(uint => Good) public goods;                 // 货物对应的id
    uint public goodsLen;                               // 物品数量
    mapping(uint => uint) public auctionBoundGood;      // 该拍卖绑定的货物

    event HighestBidIncreased(address bidder, uint bidAmount, uint bidTime, uint id);
    event AuctionEnded(address winner, uint amount, uint id);

    //启动拍卖活动
    function newAuctionStart (
        address payable beneficiary,
        string memory title,
        string memory info,
        uint amountStart,
        uint endTime,
        uint _bond,
        bool used,
        string memory brand,
        string memory picsHash,
        string memory name,
        string memory intro
    )
    public payable
    returns(uint) {

        //不能早于当前时间，起拍价格要大于0，保证金大于2*0
        require(endTime > block.timestamp);
        require(amountStart > 0);
        require(msg.value >= 2*0);
        auctionsLen++;
        Auction storage a = auctions[auctionsLen];
        a.beneficiary = beneficiary;
        a.title = title;
        a.info = info;
        a.amountStart = amountStart;
        a.numBidders = 0;
        a.highestBid = 0;
        a.endTime = endTime;
        a.startFlg = true;
        a.endFlg = false;
        a.condition = ItemCondition.noYetBid;
        a.bond = _bond;

        goodsLen++;
        Good storage g = goods[goodsLen];
        g.gid = goodsLen;
        g.name = name;
        g.used = used;
        g.picsHash = picsHash;
        g.brand = brand;
        g.owner = msg.sender;
        g.intro = intro;
        g.condition = ItemCondition.Bidding;
        auctionBoundGood[auctionsLen] = goodsLen;
        return auctionsLen;
    }
    //搜索物品当前所属的拍卖项目有bu'g
    function searchGoodBelongAuction(uint gid) public view returns(uint) {
        uint aid;
        for(uint i = 1; i <=auctionsLen; i++) {
            if(auctionBoundGood[i] == gid) {
                aid = i;
                break;
            }
        }
        return aid;
    }
    //重新上架
    function reAuctionStart(
        uint gid,
        address payable beneficiary,
        string memory title,
        string memory info,
        string memory picsHash,
        uint amountStart,
        uint endTime,
        uint _bond)
    public payable returns(uint) {
        //不能早于当前时间，起拍价格要大于0，保证金大于2*0
        require(endTime > block.timestamp);
        require(amountStart > 0);
        require(msg.value >= 2*0);
        //自动设置为二手
        goods[gid].used = true;
        //新建拍卖
        auctionsLen++;
        Auction storage a = auctions[auctionsLen];
        a.beneficiary = beneficiary;
        a.title = title;
        a.info = info;
        a.amountStart = amountStart;
        a.numBidders = 0;
        a.highestBid = 0;
        a.endTime = endTime;
        a.startFlg = true;
        a.endFlg = false;
        a.condition = ItemCondition.noYetBid;
        a.bond = _bond;
        goods[gid].condition = ItemCondition.Bidding;
        goods[gid].picsHash = picsHash;
        //新拍卖绑定旧物品
        auctionBoundGood[auctionsLen] = gid;
        return auctionsLen;
    }
    function getAuctionCondition(uint id) public view returns(ItemCondition) {
        return(auctions[id].condition);
    }
    function bid (uint id) public payable {
        //出价金额大于0，出价金额大于当前最高出价者，出价金额大于起拍价格
        require(msg.value > 0 && msg.value > auctions[id].highestBid && msg.value >= auctions[id].amountStart);
        require(auctions[id].endTime > block.timestamp);
        require(auctions[id].endFlg == false);

        //拍卖开始时的最高出价金额为0
        //若不为0，代表已经有人出过价
        //应该将前一位出价者的拍卖金退还
        if (auctions[id].highestBid != 0) {
            auctions[id].highestBidder.transfer(auctions[id].highestBid);
        }
        Auction storage a = auctions[id];
        //记录新的最高出价者与金额
        a.highestBidder = payable(msg.sender);
        a.highestBid = msg.value;
        a.condition = ItemCondition.Bidding;
        a.numBidders++;
        a.Bidders[a.numBidders].addr = payable(msg.sender);
        a.Bidders[a.numBidders].bidAmount = msg.value;
        a.Bidders[a.numBidders].bidTime = block.timestamp;
        emit HighestBidIncreased(msg.sender, msg.value, block.timestamp, id);

    }
    //获取某个拍卖的竞拍历史
    function getOneAuctionBidInfo(uint id, uint num)
    public view returns (address addr, uint bidAmount, uint bidTime) {
        Bidder storage b = auctions[id].Bidders[num];
        return (b.addr, b.bidAmount, b.bidTime);
    }
    function getMyBidAmount(address addr, uint id) public view returns (uint) {
        uint maxn = 0;
        for(uint i = 1; i <= auctions[id].numBidders; i++) {
            //找到我出价过的auction
            if(auctions[id].Bidders[i].addr == addr) {
                //找到我出价历史中的最大出价
                if(auctions[id].Bidders[i].bidAmount > maxn) {
                    maxn = auctions[id].Bidders[i].bidAmount;
                }
            }
        }
        return maxn;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    //拍卖截止后无任何人出价，拍卖发起人可申请退保证金
    function withdrawBond(uint id) public {
        //msgsender要是拍卖发起人
        require(msg.sender == auctions[id].beneficiary);
        //区块时间需大于拍卖期限
        require(block.timestamp >= auctions[id].endTime, "auction not yet ended");
        //无任何人出价
        require(auctions[id].highestBid == 0);
        //将保证金，移交给受益人
        auctions[id].beneficiary.transfer(auctions[id].bond);
        auctions[id].bond = 0;
        uint gid = auctionBoundGood[id];
        goods[gid].condition = ItemCondition.free;
    }
    //结束拍卖，结账
    function setAuctionEnd(uint id) public {
        //区块时间需大于拍卖期限 最终最高出价者确认收货才能结束拍卖 拍卖需还没设置为已结束
        require(block.timestamp >= auctions[id].endTime, "auction not yet ended");
        require(auctions[id].highestBidder == msg.sender);
        require(!auctions[id].endFlg, "auction already ended");
        //设置拍卖结束
        auctions[id].endFlg = true;
        auctions[id].condition = ItemCondition.successedAuction;
        emit AuctionEnded(auctions[id].highestBidder, auctions[id].highestBid, id);
        //将最高竞标金额，移交给受益人
        auctions[id].beneficiary.transfer(auctions[id].highestBid);
        //将保证金，移交给受益人
        auctions[id].beneficiary.transfer(auctions[id].bond);
        auctions[id].bond = 0;
        //物品所有者切换
        uint gid = auctionBoundGood[id];
        goods[gid].owner = msg.sender;
        goods[gid].condition = ItemCondition.free;
    }

}
