import styled from 'styled-components';
import { Card, Card as MaterialCard } from '@material-ui/core';
import colors from '../../utils/colors';

export const StyledCalendarCard = styled(MaterialCard)`
  padding: 16px;
  width: ${(window.innerHeight - 200) * 1.5}px;
  height: ${window.innerHeight - 200}px;
  @media (max-width: 767px) {
    width: ${window.innerWidth * 0.9}px;
  }
  & div.rbc-month-view {
    border-radius: 4px;
  }
  & div.rbc-event-content,
  & a.rbc-show-more {
    font-size: smaller;
  }
  & table.rbc-agenda-table td {
    color: ${colors.agendaText};
  }
`;

export const StyledSidePanelCard = styled(Card)`
  width: 350px;
  height: ${window.innerHeight - 200}px;
  @media (max-width: 767px) {
    width: ${window.innerWidth * 0.9}px;
  }
`;
