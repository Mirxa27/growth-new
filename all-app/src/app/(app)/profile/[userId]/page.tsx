<![CDATA[import React from 'react';

type ProfilePageProps = {
  params: {
    userId: string;
  };
};

const ProfilePage: React.FC<ProfilePageProps> = ({ params }) => {
  return (
    <div>
      <h1>Profile for User: {params.userId}</h1>
    </div>
  );
};

export default ProfilePage;
]]>