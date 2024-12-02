"use client";
import React, { useEffect, useRef, useState, useLayoutEffect,useCallback } from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Spinner
} from "@nextui-org/react";
import { TokensCard } from "@/components/tokensCard";
import { TokensCardMobile } from "@/components/tokensCardMobile";
import { BuyCard } from "@/components/buyCard";
import { KLineChart } from "@/components/kLine";
import { Thread } from "@/components/Thread";
import { Trades } from "@/components/Trades";
import { Holder } from "@/components/Holder";
import { FooterNav } from "@/components/footer";
import { useSearchParams } from "next/navigation";
import { useLocalGlobalStore } from "@/components/LocalSessionStorageContext";
import { Api } from "@/src/utils/api";
import { Image } from "@nextui-org/image";
import { PoliciesAndTerms } from "@/components/PoliciesAndTerms";
import {AlertBox} from "@/components/AlertBox";

const WEBSOCKET_API_KEY = process.env.NEXT_PUBLIC_APP_WEBSOCKET_URL;

export default function TokensDetail() {
  const socketRef = useRef(null);
  const [isUserDisconnected, setIsUserDisconnected] = useState(false);
  const [classify, setClassify] = useState(0); //按钮切换状态
  const [selected, setSelected] = React.useState(0);
  const [selectedTab, setSelectedTab] = React.useState("tokensCard");
  const [tokenValue, setTokenValue] = React.useState(0);
  const [responseData, setResponseData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [solPrice, setSolPrice] = useState(1)
  const searchParams = useSearchParams();
  const userId = useLocalGlobalStore(state => state.wallet.userId);
  const tokenId = searchParams.get('id');
  const [isMobile, setIsMobile] = useState(false);
  const [marketCapData, setMarketCapData] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const apiUrl = '/token/details', apiUrlSol = "/token/sqlPrice";
  const handleCloseAlert = () => {
    setShowAlert(false);
  };
 
  const simulateTransactionFailure = (message) => {
    setShowAlert(true);
    setAlertMessage(message);
  };
  // 使用 useLayoutEffect 而不是 useEffect，以便在 DOM 更新后同步运行  
  useLayoutEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768); // 根据你的断点设置  
    }

    handleResize(); // 组件挂载时立即调用  
    window.addEventListener('resize', handleResize); // 添加事件监听器  

    return () => {
      window.removeEventListener('resize', handleResize); // 组件卸载时移除监听器  
    };
  }, []);
  const handleTokenDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const responseData = await Api.post(apiUrl, { id: tokenId }, userId);
      // setResponseData(responseData);
      setMarketCapData(responseData);
    } catch (error) {
      setError(error);
      simulateTransactionFailure(error.message);
    } finally {
      setLoading(false);
    }
  }

  const fetchSolPrice = () => {
    Api.post(apiUrlSol, {}, userId).then(res => {
      setSolPrice(res?.solPrice);
    }).catch(error => {
    });
  };

  useEffect(() => {
    fetchSolPrice();
    // 设置定时器，每两秒请求一次SOL价格
    const intervalId = setInterval(fetchSolPrice, 60000);
    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, []);
  function isObject(data) {
    return Object.prototype.toString.call(data) === '[object Object]';
  }
  let shouldReconnect = true; // 标志位，用于控制是否应该重连
  // websocket连接
  const handleWebSocket = () => {
    if (!isUserDisconnected && tokenId && shouldReconnect) {
      const socket = new WebSocket(WEBSOCKET_API_KEY);
      socketRef.current = socket;
 
      // ... 设置 socket 事件监听器（onopen, onmessage, onerror, onclose）
      socket.onopen = () => {
        const params = { tokenId: tokenId, type: 'detail' };
        socket.send(JSON.stringify(params));
      };
      console.log(6666666);
      const handleMessage = (event) => {
        try {
          const marketData = JSON.parse(event.data);
          if (isObject(marketData) && marketData.marketCap) {
            console.log("Received market data:", event.data);
            setMarketCapData((preData) => ({
              ...preData,
              ...marketData
            }));
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
   
      socket.onmessage = handleMessage;
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      socket.onclose = (event) => {
        console.log("WebSocket connection closed:", event);
        if (!isUserDisconnected) {
          setTimeout(() => {
            if (!isUserDisconnected) {
              handleWebSocket(); // 直接调用自己进行重连
            }
          }, 1000);
        }
      };
    }
  };
 
  useEffect(() => {
    if (tokenId && shouldReconnect) {
      handleWebSocket();
    }
    // 组件卸载时的清理操作
    return () => {
      shouldReconnect = false; // 设置标志位为 false，阻止进一步的重连
      setIsUserDisconnected(true);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setMarketCapData({})
    };
  }, [tokenId, isUserDisconnected]);

  useEffect(() => {
    handleTokenDetails();//调用代币详情接口
  }, [tokenId])

  const getChildrenValue = (val) => {
    setSelectedTab(val);
  };

  const handleGoBack = () => {
    setMarketCapData({})
    window.history.back()
  }

  const btnList = [
    {
      id: "1",
      name: "Thread",
    },
    {
      id: "2",
      name: "Trades",
    },
    {
      id: "3",
      name: "Holder",
    },
  ];
  //input框样式
  const inputStyle = {
    label: "text-[#757083]",
    base: "w-full text-left border border-[#757083] rounded-xl text-[#757083]",
    input: [
      "bg-[#221F2E]",
      "hover:bg-[#221F2E]",
      "rounded-xl",
      "text-[#757083]",
    ],
    innerWrapper: ["bg-[#221F2E]", "hover:bg-[#221F2E]", "text-[#757083]"],
    inputWrapper: [
      "bg-[#221F2E]",
      "hover:bg-[#221F2E]",
      "dark:hover:bg-[#221F2E]",
      "group-data-[focus=true]:bg-[#221F2E]",
      "dark:group-data-[focus=true]:bg-[#221F2E]",
      "text-[#757083]",
    ],
  };
  if (loading) return <Spinner />;
  // console.log(responseData, "responseData")
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row justify-start items-center text-[#F2F2FC] md:text-[20px] text-[16px] md:mb-[18px] mb-[9px] cursor-pointer hover:text-[#5a58f2]" onClick={handleGoBack}>
        <Image src="/left.svg" className="w-5" />
        {"Back"}
      </div>
      {!isMobile ? <div className="hidden sm:flex flex-col gap-5 w-full justify-between items-center ">
        <div className="flex flex-row items-start gap-8 mb-1 justify-between w-full">
          <TokensCard data={marketCapData} marketCapData={marketCapData} solPrice={solPrice} />
          {marketCapData.isOutside === 0 && (<BuyCard data={marketCapData} />)}
        </div>
        <div className="flex flex-row justify-between gap-8 w-full max-w-full">
          <KLineChart tokenValue={marketCapData.isOutside} detailData={marketCapData} />
        </div>
        <div className="flex flex-row items-center gap-8 mb-4 justify-center w-full pt-5">
          <div className="flex flex-col gap-4 items-center justify-start w-full text-left">
            {/* {btnList.map((item, index) => (
            <div key={index}>
              <Button className={`${index == classify ? "bg-[#5A58F2]" : "bg-[#221F2E]"} rounded-3xl `}
              onClick={() => setClassify(index)}>{item.name}</Button>
            </div>
          ))} */}
            <div className="flex w-full flex-col">
              <Tabs
                aria-label="Options"
                variant="light"
                radius="xl"
                selectedKey={selected}
                onSelectionChange={setSelected}
                classNames={{
                  tabList: "gap-4 px-2 relative rounded-3xl text-[#ffffff]",
                  cursor: "w-full dark:bg-[#5a58f2] text-[#ffffff]  rounded-3xl",
                  tab: "h-9 rounded-3xl dark:text-[#ffffff] dark:bg-[#221F2E]",
                  tabContent: "rounded-3xl text-[#ffffff] group-data-[selected=true]:text-[#ffffff]"
                }}
              >
                {btnList.map((item, index) => (
                  <Tab key={index} title={item.name}>
                    <Card className="bg-thread">
                      <CardBody className="bg-none p-0 sm:overflow-hidden sm:overflow-y-hidden">
                        {index == 0 ? <Thread tokenId={tokenId} /> : index == 1 ? <Trades tokenId={tokenId} /> : <Holder tokenId={tokenId} tokenAddress={marketCapData.tokenPdaAddress} mintPdaAddress={marketCapData.mintPdaAddress} />}
                      </CardBody>
                    </Card>
                  </Tab>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </div> : <div className=" flex w-full sm:hidden">
        {selectedTab == "tokensCard" ? <TokensCardMobile data={marketCapData} marketCapData={marketCapData} solPrice={solPrice} /> : selectedTab == "buyCard" ? <BuyCard tokenValue={marketCapData.isOutside} data={marketCapData} /> : <Thread tokenId={tokenId} />}
      </div>}
      {/* {selectedTab !== 'msgCard' && <PoliciesAndTerms />} */}
      <AlertBox
        showAlert={showAlert}
        alertMessage={alertMessage}
        handleCloseAlert={handleCloseAlert}
      />
      <FooterNav getValue={getChildrenValue} selectedTab={selectedTab} className="flex sm:hidden w-full" />
    </div>
  );
}
