"use client";

import { Menu, usePermissions } from "react-admin";
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
import PolicyIcon from "@mui/icons-material/Policy";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import ReplayIcon from "@mui/icons-material/Replay";
import { hasAdminRole } from "@/lib/admin/roles";

export function AdminMenu() {
  const { permissions } = usePermissions();
  const isAdmin = hasAdminRole(permissions);

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
        primaryText="API brána"
        leftIcon={<RouterIcon />}
      />
      <Menu.Item
        to="/tools/health"
        primaryText="Kontrola zdravia"
        leftIcon={<MonitorHeartIcon />}
      />
      <Menu.Item
        to="/tools/services"
        primaryText="Služby"
        leftIcon={<DnsIcon />}
      />
      {isAdmin ? (
        <Menu.Item
          to="/tools/cache"
          primaryText="Vyrovnávacia pamäť"
          leftIcon={<StorageIcon />}
        />
      ) : null}
      {isAdmin ? (
        <Menu.Item
          to="/tools/messaging"
          primaryText="Správy"
          leftIcon={<HubIcon />}
        />
      ) : null}
      <Menu.Item
        to="/tools/relations"
        primaryText="Relácie"
        leftIcon={<AccountTreeIcon />}
      />
      <Menu.Item
        to="/tools/orders"
        primaryText="Fronta úloh"
        leftIcon={<QueueIcon />}
      />
      <Menu.Item
        to="/tools/emails"
        primaryText="E-maily"
        leftIcon={<EmailIcon />}
      />
      <Menu.Item
        to="/tools/lifecycle"
        primaryText="Životný cyklus"
        leftIcon={<ReplayIcon />}
      />
      <Menu.Item
        to="/tools/waitlist"
        primaryText="Čakací zoznam"
        leftIcon={<HourglassTopIcon />}
      />
      <Menu.Item
        to="/tools/loan-policy"
        primaryText="Pravidlá výpožičiek"
        leftIcon={<PolicyIcon />}
      />
      <Menu.Item
        to="/tools/links"
        primaryText="Odkazy"
        leftIcon={<LinkIcon />}
      />
      <Menu.Item
        to="/tools/auth-settings"
        primaryText="Auth nastavenia"
        leftIcon={<LockIcon />}
      />
      <Menu.Item
        to="/tools/account"
        primaryText="Účet"
        leftIcon={<BadgeIcon />}
      />
    </Menu>
  );
}
