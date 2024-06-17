import React, { useEffect, useCallback, useState } from "react";
import { Container, Nav } from "react-bootstrap";
import Products from "./components/bookMarketplace/Products";
import "./App.css";
import Wallet from "./components/Wallet";
import coverImg from "./assets/img/sandwich.jpg"; 
import { login, logout as destroy } from "./utils/auth";
import Cover from "./components/utils/Cover";
import { Notification } from "./components/utils/Notifications";
import { isAuthenticated, getPrincipalText } from "./utils/auth";
import { tokenBalance, tokenSymbol } from "./utils/icrc2_ledger";
import { icpBalance } from "./utils/ledger";
import { getAddressFromPrincipal } from "./utils/bookMarketplace";  

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState('');
  const [icrcBalance, setICRCBalance] = useState('');
  const [balance, setICPBalance] = useState('');
  const [symbol, setSymbol] = useState('');
  const [address, setAddress] = useState('');

  const fetchICRCBalance = useCallback(async () => {
    if (authenticated) {
      const balance = await tokenBalance();
      setICRCBalance(balance);
    }
  }, [authenticated]);

  const fetchICPBalance = useCallback(async () => {
    if (authenticated) {
      const balance = await icpBalance();
      setICPBalance(balance);
    }
  }, [authenticated]);

  useEffect(() => {
    const fetchSymbol = async () => {
      const symbol = await tokenSymbol();
      setSymbol(symbol);
    };
    fetchSymbol();
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      const isAuthenticatedUser = await isAuthenticated();
      setAuthenticated(isAuthenticatedUser);
      if (isAuthenticatedUser) {
        const principal = await getPrincipalText();
        setPrincipal(principal);
        const account = await getAddressFromPrincipal(principal);
        setAddress(account.account);
      }
    };
    checkAuthentication();
  }, []);

  useEffect(() => {
    fetchICRCBalance();
    fetchICPBalance();
  }, [fetchICRCBalance, fetchICPBalance]);

  return (
    <>
      <Notification />
      {authenticated ? (
        <Container fluid="md">
          <Nav className="justify-content-end pt-3 pb-5">
            <Nav.Item>
              <Wallet
                address={address}
                principal={principal}
                icpBalance={balance}
                icrcBalance={icrcBalance}
                symbol={symbol}
                isAuthenticated={authenticated}
                destroy={destroy}
              />
            </Nav.Item>
          </Nav>
          <main>
            <Products tokenSymbol={symbol} />
          </main>
        </Container>
      ) : (
        <Cover name="Book Review App" login={login} coverImg={coverImg} />
      )}
    </>
  );
};

export default App;
