// external dependency imports
import { React, useState, useEffect, useReducer, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import date from "date-and-time";

// File Imports
import Dashboard from "../components/Dashboard";
import Logout from "../components/Logout"
import UserList from "./userlist";
import { checkSesh } from "../../services/AuthService";

// style imports
import {
  AppShell,
  Burger,
  Header,
  MediaQuery,
  Navbar,
  Text,
  useMantineTheme,
} from "@mantine/core";

// socket import
import socket from "../../services/socket";

const reducer = (status, action) => {
  switch (action) {
    case "SUCCESS":
      return {
        error: null,
        hasSesh: true,
        loading: false,
      };
    case "ERROR":
      return {
        error: true,
        hasSesh: false,
        loading: false,
      };
    default:
      return status;
  }
};

export default function Home(props) {
  const navigate = useNavigate();
  const currentUser = useRef(null);


  const [active, setactive] = useState(localStorage.getItem("active"));
  // const [notify, setnotify] = useState(null);

  // checksesh handler
  const [status, dispatch] = useReducer(reducer, {
    error: null,
    hasSesh: null,
    loading: true,
  });

  useEffect(() => {
    socket.connect();
    checkSesh().then((res) => {
      if (res) {
        dispatch("SUCCESS");
        currentUser.current = res.data.userName;
      } else {
        dispatch("ERROR");
      }
      return () => {
        console.log("cleaned up");
      };
    });
  }, []);

  const handleClick = (element) => {
    if (element.hasNotification) {
      delete element.hasNotification;
    }
    setactive(element)
    localStorage.setItem(element);
  }

  // appshell tools
  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();

  const [pool, setpool] = useState([
    { userName: "Abel", socket: "Hello reciver" },
    { userName: "Abel", socket: "Hello reciver" },
  ]);

  // useEffect(() => {
  //   // const pattern = date.compile('MMM D YYYY h:m:s A');
  //   // const temp = {displayName: 'Abel', message: 'Hello reciver', now: date.format(new Date(), pattern)}
  //   // setSender(s => [...s, temp])
  // }, []);



  // io stuff
  socket.on("UsersList", (data) => {
    setpool(data);

  })

  socket.on("NewUser", (NewUser) => {
    setpool(pool.concat(NewUser));
  })

  socket.on("PrivateMsgForward", (message) => {
    console.log(message, "not")
    if (active?.userName === message.sender) {
      setactive(active);
    }
    else {
      setpool(pool.map((x) => {
        if (x.userName === message.sender) {
          x.hasNotification = true;
        }
        return x
      }));
    }
  });


  // temporary hooooooot fix
  socket.on("ChannelUpdate", ({ userName, newChannel }) => {
    for(let user in pool) {
      if (user.userName === userName) {
        user.channel = newChannel
      }
    }
  })

  socket.on("UserDisconnect", ({ userName }) => {
    setpool(pool.filter((usr) => usr.userName !== userName ))
  })
  // ---------------------------------------
  return (
    <div>
      {status.loading ? (
        <p>loading...</p>
      ) : (
        <div>
          {status.hasSesh ? (
            <AppShell
              // navbarOffsetBreakpoint controls when navbar should no longer be offset with padding-left
              navbarOffsetBreakpoint="sm"
              // fixed prop on AppShell will be automatically added to Header and Navbar
              fixed
              navbar={
                <Navbar
                  padding="md"
                  // Breakpoint at which navbar will be hidden if hidden prop is true
                  hiddenBreakpoint="sm"
                  // Hides navbar when viewport size is less than value specified in hiddenBreakpoint
                  hidden={!opened}
                  // when viewport size is less than theme.breakpoints.sm navbar width is 100%
                  // viewport size > theme.breakpoints.sm – width is 300px
                  // viewport size > theme.breakpoints.lg – width is 400px
                  width={{ sm: 300, lg: 400 }}
                >
                  <Text>Active Users</Text>
                  {pool.map((element, index) => (
                    <UserList
                      isActive={active?.userName === element.userName ? true : false}
                      newMessage={element.hasNotification}
                      handleA={(i) => handleClick(i)}
                      key={index}
                      data={element}
                    />
                  ))}
                </Navbar>
              }
              header={
                <Header height={70} padding="md">
                  {/* Handle other responsive styles with MediaQuery component or createStyles function */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "space-between"
                    }}
                  >
                    <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                      <Burger
                        opened={opened}
                        onClick={() => setOpened((o) => !o)}
                        size="sm"
                        color={theme.colors.gray[6]}
                        mr="lg"
                      />
                    </MediaQuery>
                      <Text>{currentUser.current}</Text>
                      <Logout socket={socket}/>
                  </div>
                </Header>
              }
            >
            {active && <Dashboard to={active} currentUser={currentUser.current} />}
            </AppShell>
          ) : (
            navigate("/")
          )}
        </div>
      )}
    </div>
  );
}
