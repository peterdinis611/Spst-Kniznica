"use client";

import { Menu } from "react-admin";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import StorageIcon from "@mui/icons-material/Storage";
import HubIcon from "@mui/icons-material/Hub";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import QueueIcon from "@mui/icons-material/Queue";
import BadgeIcon from "@mui/icons-material/Badge";
import RouterIcon from "@mui/icons-material/Router";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import DnsIcon from "@mui/icons-material/Dns";
import LinkIcon from "@mui/icons-material/Link";

export function AdminMenu() {
  return (
    <Menu>
      <Menu.DashboardItem />
      <Menu.ResourceItems />
      <Menu.Item
        to="/tools/import"
        primaryText="Import kníh"
        leftIcon={<UploadFileIcon />}
      />
      <Menu.Item
        to="/tools/gateway"
        primaryText="Gateway"
        leftIcon={<RouterIcon />}
      />
      <Menu.Item
        to="/tools/health"
        primaryText="Health probe"
        leftIcon={<MonitorHeartIcon />}
      />
      <Menu.Item
        to="/tools/services"
        primaryText="Služby"
        leftIcon={<DnsIcon />}
      />
      <Menu.Item
        to="/tools/cache"
        primaryText="Cache"
        leftIcon={<StorageIcon />}
      />
      <Menu.Item
        to="/tools/messaging"
        primaryText="Messaging"
        leftIcon={<HubIcon />}
      />
      <Menu.Item
        to="/tools/relations"
        primaryText="Relácie"
        leftIcon={<AccountTreeIcon />}
      />
      <Menu.Item
        to="/tools/orders"
        primaryText="Workers"
        leftIcon={<QueueIcon />}
      />
      <Menu.Item
        to="/tools/links"
        primaryText="Odkazy"
        leftIcon={<LinkIcon />}
      />
      <Menu.Item
        to="/tools/account"
        primaryText="Účet"
        leftIcon={<BadgeIcon />}
      />
    </Menu>
  );
}
