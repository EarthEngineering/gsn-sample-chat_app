import React, { useState, useEffect } from "react";
import { useWeb3Injected, useWeb3Network } from "@openzeppelin/network";
import { Button } from "rimble-ui";
import styles from "./SurveyContainer.module.scss";

const SurveyContainer = props => {
  console.log("props", props);
  const { web3Context, workshopInstance, signKey } = props;
  const {
    accounts,
    networkId,
    networkName,
    providerName,
    lib,
    connected
  } = web3Context;

  const defaultState = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const [surveyState, setSurveyState] = useState(defaultState);
  const previousBlock = 200;
  const from = signKey ? signKey.address : accounts[0];

  useEffect(() => {
    loadSurvey();
  }, []);

  useEffect(() => {
    
    const subscribeToNewResponses = async () => {
      if (workshopInstance) return await subscribeLogEvent(workshopInstance, "optionSelected");
      else return null;
    };

    let unsubscribe = subscribeToNewResponses();
    return () => {unsubscribe.unsubscribe()};
  }, [workshopInstance]);

  const loadSurvey = async () => {
    let count = defaultState;
    const currentblock = await lib.eth.getBlockNumber();
    const logs = await workshopInstance.getPastEvents("optionSelected", {
      fromBlock: currentblock - previousBlock,
      toBlock: "latest"
    });

    logs.forEach(el => {
      const { _option } = el.returnValues;
      console.log("The  options", _option);
      count = { ...count, [_option]: count[_option] + 1 };
    });
    console.log("The Count: ", count);
    setSurveyState(count);
  };

  const subscribeLogEvent = async (instance, eventName) => {
    console.log("The Instance for subscribing: ", instance, " eventName: ", eventName);
    const eventJsonInterface = lib.utils._.find(
      instance._jsonInterface,
      o => o.name === eventName && o.type === "event"
    );

    console.log("EventJsonInterface", eventJsonInterface);
    const subscription = lib.eth.subscribe(
      "logs",
      {
        address: instance.options.address,
        topics: [eventJsonInterface.signature]
      },
      (error, result) => {
        if (!error) {
          //@ This code will give you access to the eventObj.
          //@ This is nice for displaying the incoming message.
          //
          // const eventObj = lib.eth.abi.decodeLog(
          //   eventJsonInterface.inputs,
          //   result.data,
          //   result.topics.slice(1)
          // );
          // const { message, timestamp, user, uuid, mined } = eventObj;
          // const msg = { message, timestamp, user, uuid, mined};
          // console.log("New Message: ", msg);
          loadSurvey();
        }
      }
    );
    return subscription;
  };

  const incrementSurvey = async value => {
    setSurveyState({ ...surveyState, value: surveyState[value] + 1 });
  };

  const makeSelection = async option => {
    try {
      const tx = await workshopInstance.methods
        .selectOption(option)
        .send({ from });
      const txHash = tx.transactionHash;
      console.log("The Transactions: ", tx);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.row}>
      <div className={styles.colum}>
        <div className={styles.bigNumber}>{surveyState[1]}</div>
        <div>
          <Button className={styles.bigButton} onClick={() => makeSelection(1)}>Option One</Button>
        </div>
      </div>
      <div className={styles.colum}>
        <div className={styles.bigNumber}>{surveyState[2]}</div>
        <div>
          <Button className={styles.bigButton} onClick={() => makeSelection(2)}>Option Two</Button>
        </div>
      </div>
      <div className={styles.colum}>
        <div className={styles.bigNumber}>{surveyState[3]}</div>
        <div>
          <Button className={styles.bigButton} onClick={() => makeSelection(3)}>Option Three</Button>
        </div>
      </div>
      <div className={styles.colum}>
        <div className={styles.bigNumber}>{surveyState[4]}</div>
        <div>
          <Button className={styles.bigButton} onClick={() => makeSelection(4)}>Option Four</Button>
        </div>
      </div>
    </div>
  );
};
export default SurveyContainer;