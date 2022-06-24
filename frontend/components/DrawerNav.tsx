import React, { useState } from "react";
import PropTypes from "prop-types";
import NumberFormat from "react-number-format";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import { Button, Stack } from "@mui/material";
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import Router, { useRouter } from 'next/router';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import GitHubIcon from '@mui/icons-material/GitHub';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { red } from "@mui/material/colors";
import { FormType } from "../types/types";
import SettingsIcon from '@mui/icons-material/Settings';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';

export default function DrawerNav({ session, form, setCurrentPage }: { session: null | string, form: FormType | null, setCurrentPage: (idx: number) => void }) {
    const [showFormOptions, setShowFormOptions] = useState<boolean>(true);

    return (
        <Drawer
            sx={{
                width: 240,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 240,
                    boxSizing: 'border-box',
                },
            }}
            variant="permanent"
            anchor="left"
        >
            <Toolbar>
                <Typography variant="h5" component="div">
                    Furms
                </Typography>
            </Toolbar>
            <Divider />
            {form != null ?
                <List disablePadding>
                    <ListItem disablePadding>
                        <ListItemButton onClick={(_) => setShowFormOptions(!showFormOptions)}>
                            <ListItemIcon>
                                <StarIcon />
                            </ListItemIcon>
                            <ListItemText primary="Current Form" />
                            {showFormOptions ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                    </ListItem>
                    <Collapse in={showFormOptions} timeout="auto" unmountOnExit>
                        <List>
                            <ListItem disablePadding dense sx={{ pl: 4 }}>
                                <ListItemButton onClick={(_) => setCurrentPage(0)}>
                                    <ListItemIcon>
                                        <SettingsIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={"Settings"} />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding dense sx={{ pl: 4 }}>
                                <ListItemButton onClick={(_) => setCurrentPage(1)}>
                                    <ListItemIcon>
                                        <QuestionAnswerIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={"Questions"} />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </Collapse>
                    <Divider />
                </List>
                :
                null
            }
            <List>
                <ListItem disablePadding dense>
                    <ListItemButton onClick={(_) => Router.push("/")}>
                        <ListItemIcon>
                            <HomeIcon />
                        </ListItemIcon>
                        <ListItemText primary={"Home"} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding dense>
                    <ListItemButton onClick={(_) => Router.push("/forms/new")}>
                        <ListItemIcon>
                            <AddIcon />
                        </ListItemIcon>
                        <ListItemText primary={"Create a form"} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding dense>
                    <ListItemButton onClick={(_) => window.open("https://github.com/ibx34/furms", "_")}>
                        <ListItemIcon>
                            <GitHubIcon />
                        </ListItemIcon>
                        <ListItemText primary={"GitHub"} />
                    </ListItemButton>
                </ListItem>
            </List>
            <Divider />
            <List>
                {session == null ?
                    <ListItem disablePadding dense>
                        <ListItemButton onClick={(_) => Router.push(`/api/oauth2/login?service=discord&redirect_url=${window.location}`)}>
                            <ListItemIcon>
                                <LoginIcon />
                            </ListItemIcon>
                            <ListItemText primary={"Login"} />
                        </ListItemButton>
                    </ListItem>
                    :
                    <>
                        <ListItem disablePadding dense>
                            <ListItemButton onClick={(_) => Router.push("/@me")}>
                                <ListItemIcon>
                                    <PersonIcon />
                                </ListItemIcon>
                                <ListItemText primary={"My Profile"} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding dense>
                            <ListItemButton onClick={(_) => Router.push("/@me/forms")}>
                                <ListItemIcon>
                                    <ListAltIcon />
                                </ListItemIcon>
                                <ListItemText primary={"My forms"} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding dense>
                            <ListItemButton color="primary">
                                <ListItemIcon>
                                    <LogoutIcon />
                                </ListItemIcon>
                                <ListItemText primary={"Logout"} primaryTypographyProps={{ "color": red[400] }} />
                            </ListItemButton>
                        </ListItem>
                    </>
                }
            </List>
        </Drawer>
    );
}
