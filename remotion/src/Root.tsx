import React from 'react';
import { Composition } from 'remotion';
import { TourPromo } from './compositions/TourPromo';
import { InstagramReel } from './compositions/InstagramReel';
import { WorkshopPoster } from './compositions/WorkshopPoster';
import { ClusterIntro } from './compositions/ClusterIntro';
import { StatsCard } from './compositions/StatsCard';

const DEFAULT_TOPICS = [
  'Vocal Harmony',
  'Modern Music Production',
  'Piano Mastery + Improvisation',
  'Bass, Guitar & Multi-instrumental',
  'Music Theory & Ear Training',
  'The Riffs Method',
  'Jazz Improvisation',
  'Live Performance Coaching',
];

const DEFAULT_CITIES = ['Shillong', 'Kohima', 'Aizawl', 'Kochi', 'Goa', 'Mussoorie', 'Pondicherry', 'Singapore', 'Dubai', 'Hanoi', 'Cape Town'];

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="TourPromo"
        component={TourPromo}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'NATHANIEL SCHOOL OF MUSIC',
          countries: DEFAULT_CITIES,
          topics: DEFAULT_TOPICS,
        }}
      />
      <Composition
        id="InstagramReel"
        component={InstagramReel}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          cityName: 'Shillong',
          clusterName: 'Northeast',
          topics: DEFAULT_TOPICS,
        }}
      />
      <Composition
        id="WorkshopPoster"
        component={WorkshopPoster}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          institutionName: 'Workshop',
          city: 'Bangalore, India',
          topics: DEFAULT_TOPICS,
        }}
      />
      <Composition
        id="ClusterIntro"
        component={ClusterIntro}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          clusterName: 'THE NORTHEAST',
          cities: ['Guwahati', 'Shillong', 'Kohima', 'Aizawl'],
          institutionCount: 14,
        }}
      />
      <Composition
        id="StatsCard"
        component={StatsCard}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
